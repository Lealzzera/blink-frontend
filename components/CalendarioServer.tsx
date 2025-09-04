import dynamic from "next/dynamic";
import { createClient } from "@/lib/server";

// Import dinâmico do client component, desativando SSR
const CalendarioClient = dynamic(() => import("./calendario"), { ssr: false });

export default async function CalendarioServer() {
  let supabase;
  try {
    supabase = await createClient();
  } catch (err) {
    console.error("Erro ao criar Supabase client:", err);
    return <div>Erro ao criar Supabase client</div>;
  }

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) console.error("Erro ao recuperar sessão Supabase:", sessionError);

  const token = session?.access_token;
  console.log({token})
  if (!token) return <div>Usuário não autenticado</div>;

  const API_BASE = "http://blink-be-dev:3003/api/v1";
  const API_BASE2 = "https://be.blinkdentalmarketing.com.br/api/v1";

  // --- BUSCA CONFIG ---
  let currentDuration = 30;
  let allowOverbooking = false;

  try {
    const configRes = await fetch(`${API_BASE2}/configurations/appointments/1`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    console.log({configRes})

    if (configRes.ok) {
      const config = await configRes.json();
      currentDuration = config?.duration || 30;
      allowOverbooking = config?.overbooking || false;
    } else {
      console.error("Erro ao buscar config:", configRes.statusText);
    }
  } catch (err) {
    console.error("Exceção ao buscar config:", err);
  }

  // --- BUSCA AVAILABILITY ---
  const today = new Date();
  const startDate = today.toISOString().split("T")[0];
  const endDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  let availability: any[] = [];
  try {
    const availRes = await fetch(
      `${API_BASE2}/appointments/availability?start_date=${startDate}&end_date=${endDate}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
    );

    if (availRes.ok) {
      availability = await availRes.json();
    } else {
      console.error("Erro ao buscar availability:", availRes.statusText);
    }
  } catch (err) {
    console.error("Exceção ao buscar availability:", err);
  }

  // --- PROCESSA EVENTOS ---
  const calcEnd = (start: string, durMin: number) => {
    const [h, m] = start.split(":").map(Number);
    const date = new Date();
    date.setHours(h, m, 0, 0);
    return new Date(date.getTime() + durMin * 60000).toTimeString().slice(0, 5);
  };

  const grouped: Record<string, any[]> = {};
  const statuses: Record<string, string> = {};
  const sales: Record<string, any[]> = {};

  for (const day of availability) {
    if (!day.date || !Array.isArray(day.appointments)) continue;

    for (const ag of day.appointments) {
      if (!ag.name?.trim()) continue;

      const key = `${day.date}T${ag.time}`;
      if (!grouped[key]) grouped[key] = [];

      const event = {
        title: ag.name,
        start: key,
        end: `${day.date}T${calcEnd(ag.time, currentDuration)}`,
        extendedProps: { paciente: ag.name, phone: ag.phone, tipo: "Consulta", id: ag.id },
      };

      grouped[key].push(event);
      statuses[ag.id] = ag.status || "AGENDADO";
      if (ag.sales?.length) sales[ag.id] = ag.sales;
    }
  }

  const finalEvents = Object.values(grouped).flatMap(list => allowOverbooking ? list.slice(0, 2) : list.slice(0, 1));


  return (
    <CalendarioClient
      initialConfig={{ currentDuration, allowOverbooking }}
      initialEvents={finalEvents}
      initialStatuses={statuses}
      initialSales={sales}
      token={token}
    />
  );
}

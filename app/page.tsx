// app/chat/page.tsx
import { RealtimeChat } from "@/components/realtime-chat";
import { createClient } from "@/lib/server";

const USERNAME = "blink";

// Interfaces
interface ChatConfig {
  phone_number: string;
  picture_url: string;
  whats_app_name: string;
  last_message: string;
  sent_at: string;
  from_me: boolean;
  ai_answer: boolean;
}

interface ChatPhoneConfig {
  message_text: string;
  from_me: boolean;
  sent_at: string;
  ack: string;
}

// Helpers para montar headers da API
function createApiHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// Endpoints da API 
const API_BASE = 'https://be.blinkdentalmarketing.com.br/api/v1';

const apiEndpoints = {
  overview: `${API_BASE}/overview`,
  overviewPhone: `${API_BASE}/overview`,
};
// Funções que fazem os fetches
async function getOverview(
  token: string,
  page: number = 0
): Promise<ChatConfig[]> {
  const url = `${apiEndpoints.overview}?page=${page}`;
  console.log("[DEBUG] getOverview URL:", url);

  const response = await fetch(url, {
    headers: createApiHeaders(token),
    cache: "no-store",
  });

  console.log("[DEBUG] getOverview response status:", response.status);

  if (!response.ok) {
    throw new Error(`Erro ao buscar endpoint overview: ${response.status}`);
  }

  const data = await response.json();
  console.log("[DEBUG] getOverview data:", data);
  return data;
}

async function getOverviewPhone(
  token: string,
  phoneNumber: string,
  page: number = 0
): Promise<ChatPhoneConfig[]> {
  const url = `${apiEndpoints.overviewPhone}/${phoneNumber}?page=${page}`;
  console.log("[DEBUG] getOverviewPhone URL:", url);

  const response = await fetch(url, {
    headers: createApiHeaders(token),
    cache: "no-store",
  });

  console.log("[DEBUG] getOverviewPhone response status:", response.status);

  if (!response.ok) {
    throw new Error(`Erro ao buscar overviewPhone: ${response.status}`);
  }

  const data = await response.json();
  console.log("[DEBUG] getOverviewPhone data:", data);
  return data;
}

// SSR principal
export default async function ChatPage() {
  console.log("[DEBUG] Iniciando ChatPage SSR");

  // Supabase server-side client
  const supabase = await createClient();

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  console.log("[DEBUG] Supabase session:", session);
  if (sessionError) {
    console.error("[DEBUG] Erro ao recuperar sessão Supabase:", sessionError);
  }

  const token = session?.access_token;
  if (!token) {
    console.warn("[DEBUG] Token não encontrado, usuário não autenticado");
    return <div>Usuário não autenticado</div>;
  }
  console.log("[DEBUG] Token encontrado:", token);

  // Busca contatos
  let contacts: ChatConfig[] = [];
  try {
    contacts = await getOverview(token, 0);
    console.log("[DEBUG] Contatos encontrados:", contacts.length);
  } catch (err) {
    console.error("[DEBUG] Erro ao buscar contatos:", err);
  }

  // Busca mensagens do primeiro contato (se existir)
  let messages: ChatPhoneConfig[] = [];
  if (contacts.length > 0) {
    try {
      const firstContactNumber = contacts[0].phone_number;
      console.log("[DEBUG] Primeiro contato:", firstContactNumber);
      messages = await getOverviewPhone(token, firstContactNumber, 0);
      console.log("[DEBUG] Mensagens encontradas:", messages.length);
    } catch (err) {
      console.error("[DEBUG] Erro ao buscar mensagens:", err);
    }
  } else {
    console.warn("[DEBUG] Nenhum contato encontrado, pulando fetch de mensagens");
  }

  console.log("[DEBUG] Renderizando RealtimeChat com SSR");

  // Renderiza componente client com dados SSR
  return (
    <RealtimeChat
      username={USERNAME}
      initialContacts={contacts}
      initialMessages={messages}
      token={token}
    />
  );
}

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

// Endpoints da API (usando a base do .env)
const API_BASE = process.env.NEXT_PUBLIC_BLINK_BE_BASE_URL_DOCK || process.env.BLINK_BE_BASE_URL_DOCK || 'http://blink-be-dev:3003/api/v1'

const apiEndpoints = {
  overview: `${API_BASE}/overview`,
  overviewPhone: `${API_BASE}/overview-phone`,
};

// Funções que fazem os fetches
async function getOverview(
  token: string,
  page: number = 0
): Promise<ChatConfig[]> {
  const url = `${apiEndpoints.overview}?page=${page}`;
  const response = await fetch(url, {
    headers: createApiHeaders(token),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Erro ao buscar endpoint overview: ${response.status}`);
  }

  return response.json();
}

async function getOverviewPhone(
  token: string,
  phoneNumber: string,
  page: number = 0
): Promise<ChatPhoneConfig[]> {
  const url = `${apiEndpoints.overviewPhone}/${phoneNumber}?page=${page}`;
  const response = await fetch(url, {
    headers: createApiHeaders(token),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Erro ao buscar overviewPhone: ${response.status}`);
  }

  return response.json();
}

// SSR principal
export default async function ChatPage() {
  // Supabase server-side client
  const supabase = await createClient();

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("Erro ao recuperar sessão Supabase:", sessionError);
  }

  const token = session?.access_token;
  if (!token) {
    return <div>Usuário não autenticado</div>;
  }

  // Busca contatos
  let contacts: ChatConfig[] = [];
  try {
    contacts = await getOverview(token, 0);
  } catch (err) {
    console.error("Erro ao buscar contatos:", err);
  }

  // Busca mensagens do primeiro contato (se existir)
  let messages: ChatPhoneConfig[] = [];
  if (contacts.length > 0) {
    try {
      const firstContactNumber = contacts[0].phone_number;
      messages = await getOverviewPhone(token, firstContactNumber, 0);
    } catch (err) {
      console.error("Erro ao buscar mensagens:", err);
    }
  }

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

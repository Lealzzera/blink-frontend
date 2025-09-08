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

// Helpers
function createApiHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// Endpoints
const API_BASE = "http://blink-be-dev:3003/api/v1";

const apiEndpoints = {
  overview: `${API_BASE}/chat/1/overview`,
  overviewPhone: `${API_BASE}/chat/1/overview`,
};

// Funções SSR para buscar dados iniciais
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
    throw new Error(`Erro ao buscar overview: ${response.status}`);
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
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const token = session?.access_token;
  if (!token) {
    return <div>Usuário não autenticado</div>;
  }

  // Busca contatos iniciais
  let contacts: ChatConfig[] = [];
  try {
    contacts = await getOverview(token, 0);
  } catch (err) {
    console.error("[SSR] Erro ao buscar contatos:", err);
  }

  // Busca mensagens iniciais do primeiro contato
  let messages: ChatPhoneConfig[] = [];
  if (contacts.length > 0) {
    try {
      messages = await getOverviewPhone(token, contacts[0].phone_number, 0);
    } catch (err) {
      console.error("[SSR] Erro ao buscar mensagens:", err);
    }
  }

  return (
    <RealtimeChat
      username={USERNAME}
      initialContacts={contacts}
      initialMessages={messages}
      token={token}
    />
  );
}

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

// Helpers
function createApiHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// Endpoints
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://blink-be-dev:3003/api/v1";
const apiEndpoints = {
  overview: `${API_BASE}/chat/1/overview`,
};

// SSR principal
async function getOverview(token: string, page: number = 0): Promise<ChatConfig[]> {
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

  return (
    <RealtimeChat
      username={USERNAME}
      initialContacts={contacts}
      token={token}
    />
  );
}

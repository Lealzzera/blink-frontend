// app/chat/page.tsx
import { RealtimeChat } from "@/components/realtime-chat";
import { chatService, type ChatConfig, type ChatPhoneConfig } from "@/app/services/chatService";
import { createClient } from "@/lib/client";

const supabase = createClient();
const USERNAME = "blink";

async function fetchInitialData() {
  // Pega token do usuário SSR
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) throw new Error("Token de autenticação não encontrado.");

  // Busca contatos iniciais
  const contacts: ChatConfig[] = await chatService.getOverview(token, 0);

  // Busca mensagens do primeiro contato
  let messages: ChatPhoneConfig[] = [];
  if (contacts.length > 0) {
    const firstContactNumber = contacts[0].phone_number;
    messages = await chatService.getOverviewPhone(token, firstContactNumber, 0);
  }

  return { contacts, messages, token };
}

export default async function ChatPage() {
  const { contacts, messages, token } = await fetchInitialData();

  return (
    <RealtimeChat
      username={USERNAME}
      initialContacts={contacts}
      initialMessages={messages}
      token={token}
    />
  );
}

import { RealtimeChat } from "@/components/realtime-chat";
import { chatService, type ChatConfig, type ChatPhoneConfig } from "@/app/services/chatService";
import { createClient } from "@/lib/client";

const USERNAME = "blinkk";

async function fetchInitialData() {
  try {
    const supabase = createClient();
    
    // Pega a sessão no servidor
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    // Se não tiver token, retorna dados vazios
    if (!token) {
      console.warn("Token de autenticação não encontrado. Retornando dados vazios.");
      return { contacts: [], messages: [], token: null };
    }

    // Busca contatos iniciais
    const contacts: ChatConfig[] = await chatService.getOverview(token, 0);

    // Busca mensagens do primeiro contato
    let messages: ChatPhoneConfig[] = [];
    if (contacts.length > 0) {
      const firstContactNumber = contacts[0].phone_number;
      messages = await chatService.getOverviewPhone(token, firstContactNumber, 0);
    }

    return { contacts, messages, token };
  } catch (error) {
    console.error("Erro ao buscar dados iniciais:", error);
    return { contacts: [], messages: [], token: null };
  }
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
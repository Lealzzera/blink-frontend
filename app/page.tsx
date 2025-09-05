// app/chat/page.tsx
import { RealtimeChat } from '@/components/realtime-chat'
import { chatService, type ChatConfig } from '@/app/services/chatService'
import { createClient } from '@/lib/client'

const supabase = createClient()

export default async function ChatPage() {
  try {
    // Pega token do Supabase (server-side)
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData?.session?.access_token

    if (!token) {
      throw new Error('Usuário não autenticado.')
    }

    // Busca contatos iniciais via server-side
    const initialContacts: ChatConfig[] = await chatService.getOverview(token)

    return (
      <div style={{ height: '100vh' }}>
        <RealtimeChat
          username="Lucas"
          // Passa os contatos iniciais para o client component
          initialContacts={initialContacts}
        />
      </div>
    )
  } catch (err) {
    console.error('Erro ao carregar página de chat:', err)
    return (
      <div>
        <p>Erro ao carregar os contatos. Tente novamente mais tarde.</p>
      </div>
    )
  }
}

'use client'

import { useEffect, useState } from 'react'
import { RealtimeChat } from '@/components/realtime-chat'
import { chatService, type ChatConfig } from '@/app/services/chatService'
import { createClient } from '@/lib/client'

const supabase = createClient()

export default function ChatPage() {
  const [initialContacts, setInitialContacts] = useState<ChatConfig[]>([])

  useEffect(() => {
    async function loadContacts() {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData?.session?.access_token
        if (!token) throw new Error('Usuário não autenticado.')

        const contacts = await chatService.getOverview(token)
        setInitialContacts(contacts)
      } catch (err) {
        console.error('Erro ao carregar contatos:', err)
      }
    }

    loadContacts()
  }, [])

  return (
    <div style={{ height: '100vh' }}>
      <RealtimeChat
        username="blink"
        initialContacts={initialContacts}
      />
    </div>
  )
}

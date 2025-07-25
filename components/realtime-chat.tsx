'use client'

import { cn } from '@/lib/utils'
import { ChatMessageItem } from '@/components/chat-message'
import { useChatScroll } from '@/hooks/use-chat-scroll'
import {
  type ChatMessage,
  useRealtimeChat,
} from '@/hooks/use-realtime-chat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Users, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import styles from './styles/realtime-chat.module.css'
import { Switch } from '@/components/ui/switch'
import Image from 'next/image'

interface RealtimeChatProps {
  roomName: string
  username: string
  onMessage?: (messages: ChatMessage[]) => void
  messages?: ChatMessage[]
}

const mockContacts = [
  { id: 1, name: 'Fabiana', number: '(11)999999999', scheduled: true, photo: '' },
  { id: 2, name: 'Lucas', number: '(11)983401004', scheduled: true, photo: '' },
  { id: 3, name: 'Ricardo', number: '(11)999999999', scheduled: true, photo: '' },
  { id: 4, name: 'Guilherme', number: '(11)982006666', scheduled: true, photo: '' },
  { id: 5, name: 'Paula', number: '(11)999999999', scheduled: true, photo: '' },
  { id: 6, name: 'Rafael', number: '(11)999999999', scheduled: true, photo: '' },
  { id: 7, name: 'Miguel', number: '(11)999999999', scheduled: true, photo: '' },
  { id: 8, name: 'Melissa', number: '(11)999999999', scheduled: true, photo: '' },
  { id: 9, name: 'Nome do Contato', number: '(11)999999999', scheduled: true, photo: '' },
  { id: 10, name: 'Nome do Contato', number: '(11)999999999', scheduled: true, photo: '' },
  { id: 11, name: 'Nome do Contato', number: '(11)999999999', scheduled: true, photo: '' },
]

export const RealtimeChat = ({
  roomName,
  username,
  onMessage,
  messages: initialMessages = [],
}: RealtimeChatProps) => {
  const { containerRef, scrollToBottom } = useChatScroll()

  const {
    messages: realtimeMessages,
    sendMessage,
    isConnected,
  } = useRealtimeChat({
    roomName,
    username,
  })

  const [newMessage, setNewMessage] = useState('')
  const [contacts, setContacts] = useState<typeof mockContacts>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedContact, setSelectedContact] = useState<typeof mockContacts[0] | null>(null)
  const [showContacts, setShowContacts] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchContacts = async () => {
      setContacts(mockContacts)
      setSelectedContact(mockContacts[0])
    }
    fetchContacts()
  }, [])

  const allMessages = useMemo(() => {
    const mergedMessages = [...initialMessages, ...realtimeMessages]
    const uniqueMessages = mergedMessages.filter(
      (message, index, self) => index === self.findIndex((m) => m.id === message.id)
    )
    return uniqueMessages.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }, [initialMessages, realtimeMessages])

  useEffect(() => {
    if (onMessage) onMessage(allMessages)
  }, [allMessages, onMessage])

  useEffect(() => {
    scrollToBottom()
  }, [allMessages, scrollToBottom])

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleMenu = () => setShowContacts(prev => !prev)

  const handleSendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!newMessage.trim() || !isConnected || !selectedContact || isSending) return

      try {
        setIsSending(true)
        setError(null)

        // Envia para o Supabase Chat
        sendMessage(newMessage)

        // Formata o número de telefone
        const phoneNumber = selectedContact.number.replace(/\D/g, '')
        const formattedNumber = phoneNumber.startsWith('55') ? phoneNumber : `55${phoneNumber}`

        // Verifica se o número está completo
        if (formattedNumber.length < 12) {
          throw new Error('Número de telefone inválido. Deve incluir DDD e 9 dígitos.')
        }

        // Envia para o WhatsApp via backend
        const response = await fetch('https://be.blinkdentalmarketing.com.br/message/whats-app/send-message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Adicione se necessário:
            // 'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            clinic_id: 1, // Verifique se este ID é válido
            message: newMessage,
            phone_number: formattedNumber
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || `Erro HTTP: ${response.status}`)
        }

        // Limpa a mensagem
        setNewMessage('')
      } catch (err) {
        console.error('Erro ao enviar mensagem:', err)
        setError(err instanceof Error ? err.message : 'Erro desconhecido ao enviar mensagem')
      } finally {
        setIsSending(false)
      }
    },
    [newMessage, isConnected, selectedContact, sendMessage, isSending]
  )

  return (
    <div className={styles.container}>
      <div
        className={styles.contacts}
        style={isMobile ? {
          transform: showContacts ? 'translateX(0)' : 'translateX(-100%)'
        } : {}}
      >
        <div className={styles.contactHeader}>
          <div className={styles.contact_icon}>
            <Users className={styles.iconContact} />
            <h3 className={styles.contactTitle}>Contatos</h3>
          </div>
          <div className={styles.search_container}>
            <Search className={styles.searchIcon} size={16} />
            <input
              type="text"
              placeholder="Pesquisar por contato"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <hr />
        </div>
        {contacts
          .filter(contact => contact.name.toLowerCase().includes(searchTerm.toLowerCase()))
          .map(contact => (
            <div
              key={contact.id}
              className={styles.contact}
              onClick={() => {
                setSelectedContact(contact)
                if (isMobile) toggleMenu()
              }}
            >
              <div className={styles.contactPhoto}>
                <Image
                  src={contact.photo || `https://dummyimage.com/100x100/eee/.png&text=${contact.name.charAt(0)}`}
                  alt={contact.name}
                  width={45}
                  height={45}
                  className={styles.photo}
                />
                <div className={styles.insideContact}>
                  <h3 className={styles.name}>{contact.name}</h3>
                  <p className={styles.number}>{contact.number}</p>
                </div>
              </div>
              <Switch className={styles.switch} defaultChecked />
            </div>
        ))}
      </div>
      <div className={styles.chat}>
        <div className={styles.chatHeader}>
          <div className={styles.spanContainer} onClick={toggleMenu}>
            <span className={styles.span1}></span>
            <span className={styles.span2}></span>
            <span className={styles.span3}></span>
          </div>
          {selectedContact && (
            <div className={styles.chatHeaderContact}>
              <Image
                src={selectedContact.photo || `https://dummyimage.com/100x100/eee/.png&text=${selectedContact.name.charAt(0)}`}
                alt={selectedContact.name}
                width={44}
                height={40}
                className={styles.chatPhoto}
              />
              <h3 className={styles.headerTitle}>{selectedContact.name}</h3>
            </div>
          )}
          <Switch className={styles.switch} defaultChecked />
        </div>
        <div ref={containerRef} className={styles.messages}>
          {allMessages.length === 0 && (
            <div className={styles.noMessages}>Sem mensagens por enquanto.</div>
          )}
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}
          <div className={styles.messageList}>
            {allMessages.map((message, index) => {
              const prevMessage = index > 0 ? allMessages[index - 1] : null
              const showHeader = !prevMessage || prevMessage.user.name !== message.user.name
              return (
                <div key={message.id} className={styles.messageItem}>
                  <ChatMessageItem
                    message={message}
                    isOwnMessage={message.user.name === username}
                    showHeader={showHeader}
                  />
                </div>
              )
            })}
          </div>
        </div>
        <form onSubmit={handleSendMessage} className={styles.inputContainer}>
          <Input
            className={cn(
              styles.inputMessage,
              isConnected && newMessage.trim() ? styles.inputMessageActive : ''
            )}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite a mensagem..."
            disabled={!isConnected || isSending}
          />
          {isConnected && newMessage.trim() && (
            <Button 
              className={styles.sendButton} 
              type="submit" 
              disabled={!isConnected || isSending}
            >
              {isSending ? 'Enviando...' : <Send className={styles.sendIcon} />}
            </Button>
          )}
        </form>
      </div>
    </div>
  )
}
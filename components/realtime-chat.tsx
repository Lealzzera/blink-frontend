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
import { Send } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import styles from './styles/realtime-chat.module.css';
import { Switch } from "@/components/ui/switch"

interface RealtimeChatProps {
  roomName: string
  username: string
  onMessage?: (messages: ChatMessage[]) => void
  messages?: ChatMessage[]
}

// Simulação de resposta de uma API
const mockContacts = [
  { id: 1, name: 'Fabiana', number: '(11)999999999', scheduled: true },
  { id: 2, name: 'Lucas', number: '(11)999999999', scheduled: true },
  { id: 3, name: 'Ricardo', number: '(11)999999999', scheduled: true },
  { id: 4, name: 'Guilherme', number: '(11)999999999', scheduled: true },
  { id: 5, name: 'Paula', number: '(11)999999999', scheduled: true },
  { id: 6, name: 'Rafael', number: '(11)999999999', scheduled: true },
  { id: 7, name: 'Miguel', number: '(11)999999999', scheduled: true },
  { id: 8, name: 'Melissa', number: '(11)999999999', scheduled: true },
  { id: 9, name: 'Nome do Contato', number: '(11)999999999', scheduled: true },
  { id: 10, name: 'Nome do Contato', number: '(11)999999999', scheduled: true },
  { id: 11, name: 'Nome do Contato', number: '(11)999999999', scheduled: true },
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

  // Carrega os contatos como se fossem de uma API
  useEffect(() => {
    // Simula delay de API
    const fetchContacts = async () => {
      setContacts(mockContacts)
      setSelectedContact(mockContacts[0]) // Primeiro Nome como Padrao
    }

    fetchContacts()
  }, [])

  const allMessages = useMemo(() => {
    const mergedMessages = [...initialMessages, ...realtimeMessages]
    const uniqueMessages = mergedMessages.filter(
      (message, index, self) => index === self.findIndex((m) => m.id === message.id)
    )
    const sortedMessages = uniqueMessages.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    return sortedMessages
  }, [initialMessages, realtimeMessages])

  useEffect(() => {
    if (onMessage) {
      onMessage(allMessages)
    }
  }, [allMessages, onMessage])

  useEffect(() => {
    scrollToBottom()
  }, [allMessages, scrollToBottom])

  const handleSendMessage = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!newMessage.trim() || !isConnected) return
      sendMessage(newMessage)
      setNewMessage('')
    },
    [newMessage, isConnected, sendMessage]
  )

  const [showContacts, setShowContacts] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleMenu = () => {
    setShowContacts((prev) => !prev);
  };

  return (
    <div className={styles.container}>

      <div className={styles.contacts}
        style={{
          display: isMobile ? (showContacts ? 'block' : 'none') : 'block',
        }}>

        <div className={styles.contactHeader}>
          <h3 className={styles.contactTitle}>Contatos</h3>
          <input 
            type="text" 
            placeholder="Pesquisar por contato"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <hr />
        </div>

        {contacts
          .filter((contact) =>
            contact.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map((contact) => (
            <div
              key={contact.id}
              className={styles.contact}
              onClick={() => {
                setSelectedContact(contact)
                if (isMobile) toggleMenu()
              }}
            >
              <div className={styles.insideContact}>
                <h3 className={styles.name}>{contact.name}</h3>
                <p className={styles.number}>{contact.number}</p>
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
          <h3 className={styles.headerTitle}>{selectedContact?.name ?? 'Carregando...'}</h3>
          <Switch className={styles.switch} defaultChecked />
        </div>

        <div ref={containerRef} className={styles.messages}>
          {allMessages.length === 0 ? (
            <div className={styles.noMessages}>
              Sem mensagens por enquanto.
            </div>
          ) : null}

          <div className={styles.messageList}>
            {allMessages.map((message, index) => {
              const prevMessage = index > 0 ? allMessages[index - 1] : null;
              const showHeader = !prevMessage || prevMessage.user.name !== message.user.name;

              return (
                <div
                  key={message.id}
                  className={styles.messageItem}
                >
                  <ChatMessageItem
                    message={message}
                    isOwnMessage={message.user.name === username}
                    showHeader={showHeader}
                  />
                </div>
              );
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
            disabled={!isConnected}
          />
          {isConnected && newMessage.trim() && (
            <Button
              className={styles.sendButton}
              type="submit"
              disabled={!isConnected}
            >
              <Send className={styles.sendIcon} />
            </Button>
          )}
        </form>
      </div>
    </div>
  )
}

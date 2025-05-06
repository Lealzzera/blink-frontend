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

/**
 * Realtime chat component
 * @param roomName - The name of the room to join. Each room is a unique chat.
 * @param username - The username of the user
 * @param onMessage - The callback function to handle the messages. Useful if you want to store the messages in a database.
 * @param messages - The messages to display in the chat. Useful if you want to display messages from a database.
 * @returns The chat component
 */
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

  // Merge realtime messages with initial messages
  const allMessages = useMemo(() => {
    const mergedMessages = [...initialMessages, ...realtimeMessages]
    // Remove duplicates based on message id
    const uniqueMessages = mergedMessages.filter(
      (message, index, self) => index === self.findIndex((m) => m.id === message.id)
    )
    // Sort by creation date
    const sortedMessages = uniqueMessages.sort((a, b) => a.createdAt.localeCompare(b.createdAt))

    return sortedMessages
  }, [initialMessages, realtimeMessages])

  useEffect(() => {
    if (onMessage) {
      onMessage(allMessages)
    }
  }, [allMessages, onMessage])

  useEffect(() => {
    // Scroll to bottom whenever messages change
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

  return (
    <div className={styles.container}>

  <div className={styles.contacts}>
    <div className={styles.contactHeader}>
      <h3>Contatos</h3>
      <input type="text" placeholder='Pesquisar por contato'/> 
      <hr /> 
    </div>

    <div className={styles.contact}>
      <div className={styles.insideContact}>
        <h3 className={styles.name}>Fabiana</h3>
        <p className={styles.number}>(11)999999999</p>
      </div>{/* Fechamento da insideContact */}
      <Switch className={styles.switch} defaultChecked />
    </div> {/* Fechamento da Contact */}
    <hr className={styles.line}/>

    <div className={styles.contact}>
      <div className={styles.insideContact}>
        <h3 className={styles.name}>Lucas</h3>
        <p className={styles.number}>(11)999999999</p>
      </div>{/* Fechamento da insideContact */}
      <Switch className={styles.switch} defaultChecked />
    </div> {/* Fechamento da Contact */}
    <hr className={styles.line}/>

    <div className={styles.contact}>
      <div className={styles.insideContact}>
        <h3 className={styles.name}>Ricardo</h3>
        <p className={styles.number}>(11)999999999</p>
      </div>{/* Fechamento da insideContact */}
      <Switch className={styles.switch} defaultChecked />
    </div> {/* Fechamento da Contact */}
    <hr className={styles.line}/>

    <div className={styles.contact}>
      <div className={styles.insideContact}>
        <h3 className={styles.name}>Guilherme</h3>
        <p className={styles.number}>(11)999999999</p>
      </div>{/* Fechamento da insideContact */}
      <Switch className={styles.switch} defaultChecked />
    </div> {/* Fechamento da Contact */}
    <hr className={styles.line}/>

    <div className={styles.contact}>
      <div className={styles.insideContact}>
        <h3 className={styles.name}>Paula</h3>
        <p className={styles.number}>(11)999999999</p>
      </div>{/* Fechamento da insideContact */}
      <Switch className={styles.switch} defaultChecked />
    </div> {/* Fechamento da Contact */}
    <hr className={styles.line}/>

    <div className={styles.contact}>
      <div className={styles.insideContact}>
        <h3 className={styles.name}>Rafael</h3>
        <p className={styles.number}>(11)999999999</p>
      </div>{/* Fechamento da insideContact */}
      <Switch className={styles.switch} defaultChecked />
    </div> {/* Fechamento da Contact */}
    <hr className={styles.line}/>

    <div className={styles.contact}>
      <div className={styles.insideContact}>
        <h3 className={styles.name}>Miguel</h3>
        <p className={styles.number}>(11)999999999</p>
      </div>{/* Fechamento da insideContact */}
      <Switch className={styles.switch} defaultChecked />
    </div> {/* Fechamento da Contact */}
    <hr className={styles.line}/>

    <div className={styles.contact}>
      <div className={styles.insideContact}>
        <h3 className={styles.name}>Melissa</h3>
        <p className={styles.number}>(11)999999999</p>
      </div>{/* Fechamento da insideContact */}
      <Switch className={styles.switch} defaultChecked />
    </div> {/* Fechamento da Contact */}
    <hr className={styles.line}/>

    <div className={styles.contact}>
      <div className={styles.insideContact}>
        <h3 className={styles.name}>Nome do Contato</h3>
        <p className={styles.number}>(11)999999999</p>
      </div>{/* Fechamento da insideContact */}
      <Switch className={styles.switch} defaultChecked />
    </div> {/* Fechamento da Contact */}
    <hr className={styles.line}/>

    <div className={styles.contact}>
      <div className={styles.insideContact}>
        <h3 className={styles.name}>Nome do Contato</h3>
        <p className={styles.number}>(11)999999999</p>
      </div>{/* Fechamento da insideContact */}
      <Switch className={styles.switch} defaultChecked />
    </div> {/* Fechamento da Contact */}
    <hr className={styles.line}/>

    <div className={styles.contact}>
      <div className={styles.insideContact}>
        <h3 className={styles.name}>Nome do Contato</h3>
        <p className={styles.number}>(11)999999999</p>
      </div>{/* Fechamento da insideContact */}
      <Switch className={styles.switch} defaultChecked />
    </div> {/* Fechamento da Contact */}
    <hr className={styles.line}/>

  </div>{/* Fechamento da Contacts */}

  <div className={styles.chat}>



    <div className={styles.chatHeader}>
      <h3 className={styles.headerTitle}>Ricardo</h3>
      <Switch className={styles.switch} defaultChecked />
    </div>

    {/* Messages */}

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

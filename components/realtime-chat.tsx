'use client'

import { cn } from '@/lib/utils';
import { ChatMessageItem } from '@/components/chat-message';
import { useChatScroll } from '@/hooks/use-chat-scroll';
import { type ChatMessage, useRealtimeChat } from '@/hooks/use-realtime-chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Users, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import styles from './styles/realtime-chat.module.css';
import { Switch } from '@/components/ui/switch';
import Image from 'next/image';
import { createClient } from '@/lib/client';

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

interface RealtimeChatProps {
  username: string;
  initialContacts?: ChatConfig[];
  token?: string;
}

const supabase = createClient();
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://blink-be-dev:3003/api/v1";

const formatDateTime = (dateString?: string | null) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
};

export const RealtimeChat = ({
  username,
  initialContacts = [],
  token,
}: RealtimeChatProps) => {
  const { containerRef, scrollToBottom } = useChatScroll();

  const [newMessage, setNewMessage] = useState('');
  const [contacts, setContacts] = useState<any[]>(initialContacts.map(c => ({
    id: c.phone_number,
    name: c.whats_app_name || c.phone_number,
    number: c.phone_number,
    scheduled: c.ai_answer ?? false,
    photo: c.picture_url || '',
    lastMessage: c.last_message,
    sentAt: c.sent_at,
    fromMe: c.from_me,
    roomName: c.phone_number,
  })));
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState<any | null>(contacts[0] || null);
  const [showContacts, setShowContacts] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // paginação contatos
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  // paginação mensagens
  const [pageMessages, setPageMessages] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const loaderMessagesRef = useRef<HTMLDivElement | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const { messages: realtimeMessages, sendMessage, isConnected } = useRealtimeChat({
    roomName: selectedContact?.roomName || '',
    username,
  });

  // Combina histórico + realtime
  const allMessages = useMemo(() => {
    const mergedMessages = [...messages, ...realtimeMessages];
    const uniqueMessages = mergedMessages.filter(
      (message, index, self) =>
        index === self.findIndex(m => m.id === message.id)
    );
    return uniqueMessages.sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [messages, realtimeMessages]);

  // ✅ scroll automático melhorado
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;

    if (isNearBottom) {
      const timeout = setTimeout(() => scrollToBottom(), 50);
      return () => clearTimeout(timeout);
    }
  }, [allMessages, scrollToBottom]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMenu = () => setShowContacts(prev => !prev);

  // busca contatos paginados
  const fetchContacts = useCallback(async (pageToLoad: number) => {
    try {
      setLoadingContacts(true);
      
      if (!token) {
        const { data: sessionData } = await supabase.auth.getSession();
        token = sessionData.session?.access_token;
        if (!token) {
          setError('Token de autenticação não encontrado.');
          setLoadingContacts(false);
          return;
        }
      }

      const response = await fetch(`${API_BASE}/chat/1/overview?page=${pageToLoad}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const apiContacts: ChatConfig[] = await response.json();

      if (!apiContacts || apiContacts.length === 0) {
        setHasMore(false);
        return;
      }

      const mappedContacts = apiContacts.map((c) => ({
        id: c.phone_number,
        name: c.whats_app_name || c.phone_number || 'Contato sem nome',
        number: c.phone_number || '',
        scheduled: c.ai_answer ?? false,
        photo: c.picture_url || '',
        lastMessage: c.last_message,
        sentAt: c.sent_at,
        fromMe: c.from_me,
        roomName: c.phone_number,
      }));

      setContacts(prev => {
        const contactMap = new Map<string, any>();
        [...prev, ...mappedContacts].forEach(c => {
          if (c.number) contactMap.set(c.number, c);
        });
        return Array.from(contactMap.values());
      });

      if (pageToLoad === 0 && mappedContacts.length > 0 && !selectedContact) {
        setSelectedContact(mappedContacts[0]);
      }
    } catch (err) {
      setError('Erro ao buscar contatos.');
      console.error('Erro ao buscar contatos:', err);
    } finally {
      setLoadingContacts(false);
    }
  }, [token, selectedContact]);

  useEffect(() => {
    fetchContacts(0);
  }, [fetchContacts]);

  // infinite scroll contatos
  useEffect(() => {
    if (!loaderRef.current || !hasMore) return;

    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loadingContacts) {
        setPage(prev => {
          const next = prev + 1;
          fetchContacts(next);
          return next;
        });
      }
    });

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [fetchContacts, hasMore, loadingContacts]);

  // busca mensagens paginadas
  const fetchMessages = useCallback(
    async (pageToLoad: number, reset = false) => {
      if (!selectedContact) return;
      try {
        setLoadingMessages(true);
        
        let authToken = token;
        if (!authToken) {
          const { data: sessionData } = await supabase.auth.getSession();
          authToken = sessionData.session?.access_token;
          if (!authToken) throw new Error('Token de autenticação não encontrado.');
        }

        const phoneNumber = selectedContact.number;
        const response = await fetch(`${API_BASE}/chat/1/overview/${phoneNumber}?page=${pageToLoad}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status}`);
        }

        const lastMessages: ChatPhoneConfig[] = await response.json();

        if (!lastMessages || lastMessages.length === 0) {
          setHasMoreMessages(false);
          return;
        }

        const mappedMessages: ChatMessage[] = lastMessages.map((msg) => ({
          id: `${msg.sent_at}-${msg.from_me}-${msg.message_text}`,
          text: msg.message_text,
          content: msg.message_text,
          user: { name: msg.from_me ? username : selectedContact.name },
          createdAt: msg.sent_at,
        }));

        setMessages(prev =>
          reset ? mappedMessages : [...mappedMessages, ...prev]
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao buscar mensagens');
        console.error(err);
      } finally {
        setLoadingMessages(false);
      }
    },
    [selectedContact, username, token]
  );

  // resetar mensagens ao trocar de contato
  useEffect(() => {
    if (!selectedContact) return;
    setPageMessages(0);
    setHasMoreMessages(true);
    fetchMessages(0, true);
  }, [selectedContact, fetchMessages]);

  // infinite scroll mensagens
  useEffect(() => {
    if (!loaderMessagesRef.current || !hasMoreMessages) return;

    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loadingMessages) {
        setPageMessages(prev => {
          const next = prev + 1
          fetchMessages(next)
          return next
        })
      }
    })

    observer.observe(loaderMessagesRef.current)
    return () => observer.disconnect()
  }, [fetchMessages, hasMoreMessages, loadingMessages])

  const handleSendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!newMessage.trim() || !isConnected || !selectedContact || isSending) return

      try {
        setIsSending(true)
        setError(null)

        sendMessage(newMessage)

        let authToken = token;
        if (!authToken) {
          const { data: sessionData } = await supabase.auth.getSession()
          authToken = sessionData.session?.access_token
          if (!authToken) throw new Error('Token de autenticação não encontrado.')
        }

        const phoneNumber = selectedContact.number.replace(/\D/g, '')
        const formattedNumber = phoneNumber.startsWith('55') ? phoneNumber : `55${phoneNumber}`

        if (formattedNumber.length < 12) throw new Error('Número de telefone inválido.')

        const response = await fetch(`${API_BASE}/message/whats-app/send-message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            clinic_id: 1,
            message: newMessage,
            phone_number: formattedNumber,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || `Erro HTTP: ${response.status}`)
        }

        setNewMessage('')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido ao enviar mensagem')
      } finally {
        setIsSending(false)
      }
    },
    [newMessage, isConnected, selectedContact, sendMessage, isSending, token]
  )

  return (
    <div className={styles.container}>
      {/* Contatos */}
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

        {loadingContacts && (
          <div className={styles.skeletonList}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className={styles.skeletonContact}>
                <div className={styles.skeletonAvatar}></div>
                <div className={styles.skeletonInfo}>
                  <div className={styles.skeletonLine}></div>
                  <div className={styles.skeletonLineShort}></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loadingContacts &&
          contacts
            .filter(contact => contact.name?.toLowerCase().includes(searchTerm.toLowerCase()))
            .map(contact => (
              <div
                className={styles.contactCard}
                key={contact.id}
                onClick={() => {
                  setSelectedContact(contact)
                  if (isMobile) toggleMenu()
                }}
              >
                <div className={styles.header}>
                  <h3 className={styles.name}>{contact.name}</h3>
                  <Switch className={styles.switch} defaultChecked={contact.scheduled} />
                </div>

                <div className={styles.body}>
                  <Image
                    src={contact.photo || `https://dummyimage.com/100x100/eee/.png&text=${contact.name.charAt(0)}`}
                    alt={contact.name}
                    width={45}
                    height={45}
                    className={styles.photo}
                  />
                  <div className={styles.messageRow}>
                    <p className={styles.lastMessage}>
                      {contact.fromMe ? `${contact.lastMessage} ✓` : contact.lastMessage}
                    </p>
                    <p className={styles.sentAt}>{formatDateTime(contact.sentAt)}</p>
                  </div>
                </div>
              </div>
            ))
        }

        {hasMore && !loadingContacts && (
          <div ref={loaderRef} className={styles.loader}>
            <p>Carregando...</p>
          </div>
        )}
      </div>

      {/* Chat */}
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
          <Switch className={styles.switch} defaultChecked={selectedContact?.scheduled} />
        </div>

        <div ref={containerRef} className={styles.messages}>
          {hasMoreMessages && (
            <div ref={loaderMessagesRef} className={styles.loaderTop}>
              {loadingMessages ? <p>Carregando mensagens...</p> : <p>Carregar mais</p>}
            </div>
          )}

          {allMessages.length === 0 && !loadingMessages && (
            <div className={styles.noMessages}>Sem mensagens por enquanto.</div>
          )}
          {error && <div className={styles.errorMessage}>{error}</div>}
          <div className={styles.messageList}>
            {allMessages.map((message, index) => {
              const prevMessage = index > 0 ? allMessages[index - 1] : null
              const showHeader = !prevMessage || prevMessage.user?.name !== message.user?.name
              const displayMessage = message.user?.name === username
                ? `${message.content} ✓`
                : message.content
              return (
                <div key={message.id} className={styles.messageItem}>
                  <ChatMessageItem
                    message={{
                      ...message,
                      content: displayMessage,
                      createdAt: formatDateTime(message.createdAt),
                    }}
                    isOwnMessage={message.user?.name === username}
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
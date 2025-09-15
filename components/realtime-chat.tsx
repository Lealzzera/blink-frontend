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
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

// Interfaces simplificadas
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

const formatDateTime = (dateString?: string | null) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
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

  useEffect(() => {
    const socket = new SockJS(`https://be.blinkdentalmarketing.com.br/api/v1/wpp-socket?token=${token}`)
    socket.onopen = () => {
      console.log('Conectado no websocket')
    }
    socket.onmessage = (msg) => console.log('recebido', msg)
  }, [token]);

  // Estado contatos
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
  const [contactsPage, setContactsPage] = useState(0);
  const [hasMoreContacts, setHasMoreContacts] = useState(true);
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Estado mensagens
  const [selectedContact, setSelectedContact] = useState<any>(contacts[0] || null);
  const [messagesByContact, setMessagesByContact] = useState<Record<string, ChatMessage[]>>({});
  const [paginationByContact, setPaginationByContact] = useState<Record<string, { page: number; hasMore: boolean; loading: boolean }>>({});

  // Novo estado
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // WebSocket STOMP (usando hook adaptado)
  const { messages: realtimeMessages, sendMessage, isConnected } = useRealtimeChat({
    roomName: selectedContact?.roomName || '',
    username,
    token,
    clinicId: 1,
  });

  // Junta mensagens SSR + realtime
  const allMessages = useMemo(() => {
    const msgs = messagesByContact[selectedContact?.number || ''] || [];
    const merged = [...msgs, ...realtimeMessages];
    const unique = merged.filter((m, i, self) => i === self.findIndex(msg => msg.id === m.id));
    return unique.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [messagesByContact, realtimeMessages, selectedContact]);

  // Detecta mobile
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMenu = () => setShowContacts(prev => !prev);

  // Função buscar mais contatos
  const loadMoreContacts = async () => {
    if (!token || !hasMoreContacts || loadingContacts) return;
    try {
      setLoadingContacts(true);
      const nextPage = contactsPage + 1;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'https://be.blinkdentalmarketing.com.br/api/v1'}/chat/1/overview?page=${nextPage}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data: ChatConfig[] = await res.json();
        if (data.length > 0) {
          setContacts(prev => [...prev, ...data.map(c => ({
            id: c.phone_number,
            name: c.whats_app_name || c.phone_number,
            number: c.phone_number,
            scheduled: c.ai_answer ?? false,
            photo: c.picture_url || '',
            lastMessage: c.last_message,
            sentAt: c.sent_at,
            fromMe: c.from_me,
            roomName: c.phone_number,
          }))]);
          setContactsPage(nextPage);
        } else {
          setHasMoreContacts(false);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar mais contatos", err);
      setHasMoreContacts(false);
    } finally {
      setLoadingContacts(false);
    }
  };

  // Função buscar mensagens ao selecionar contato
  const fetchMessages = useCallback(async (contactNumber: string, pageToLoad: number = 0, reset: boolean = false) => {
    if (!token || !contactNumber) return;
    try {
      setPaginationByContact(prev => ({
        ...prev,
        [contactNumber]: { ...(prev[contactNumber] || { page: 0, hasMore: true, loading: false }), loading: true }
      }));

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'https://be.blinkdentalmarketing.com.br/api/v1'}/chat/1/overview/${contactNumber}?page=${pageToLoad}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data: ChatPhoneConfig[] = await res.json();
        if (data.length > 0) {
          const mappedMessages = data.map(msg => ({
            id: `${contactNumber}-${msg.sent_at}-${msg.from_me}`,
            text: msg.message_text,
            content: msg.message_text,
            user: { name: msg.from_me ? username : contactNumber },
            createdAt: msg.sent_at,
          }));

          setMessagesByContact(prev => ({
            ...prev,
            [contactNumber]: reset ? mappedMessages : [...mappedMessages, ...(prev[contactNumber] || [])]
          }));

          setPaginationByContact(prev => ({
            ...prev,
            [contactNumber]: {
              page: reset ? 0 : pageToLoad,
              hasMore: data.length >= 20,
              loading: false,
            }
          }));
        } else {
          setPaginationByContact(prev => ({
            ...prev,
            [contactNumber]: { ...(prev[contactNumber] || { page: 0, hasMore: false, loading: false }), hasMore: false, loading: false }
          }));
        }
      }
    } catch (err) {
      console.error("Erro ao carregar mensagens", err);
      setPaginationByContact(prev => ({
        ...prev,
        [contactNumber]: { ...(prev[contactNumber] || { page: 0, hasMore: false, loading: false }), hasMore: false, loading: false }
      }));
    }
  }, [token, username]);

  // Função buscar mais mensagens (rolando para cima)
  const loadMoreMessages = async () => {
    if (!selectedContact) return;
    const { page, hasMore, loading } = paginationByContact[selectedContact.number] || { page: 0, hasMore: true, loading: false };
    if (!hasMore || loading || !containerRef.current) return;

    const el = containerRef.current;
    const prevScrollHeight = el.scrollHeight;
    const prevScrollTop = el.scrollTop;

    const nextPage = page + 1;
    await fetchMessages(selectedContact.number, nextPage, false);

    requestAnimationFrame(() => {
      if (el) {
        const newScrollHeight = el.scrollHeight;
        el.scrollTop = prevScrollTop + (newScrollHeight - prevScrollHeight);
      }
    });
  };

  // Carregar mensagens quando selecionar um contato
  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact.number, 0, true).then(() => {
        setTimeout(() => scrollToBottom(), 100);
      });
    }
  }, [selectedContact, fetchMessages, scrollToBottom]);

  // Scroll contatos -> fim da lista carrega mais
  const contactsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = contactsRef.current;
    if (!el) return;

    const onScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 700) {
        loadMoreContacts();
      }
    };

    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [contactsPage, token, hasMoreContacts, loadingContacts]);

  // Scroll mensagens -> topo carrega mais
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !selectedContact) return;
    
    const onScroll = () => {
      const { loading } = paginationByContact[selectedContact.number] || { loading: false };
      if (el.scrollTop <= 20 && !loading) {
        loadMoreMessages();
      }
    };
    
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [paginationByContact, selectedContact]);

  // Enviar mensagem
  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !isConnected || !selectedContact || isSending) return;

    try {
      setIsSending(true);
      setError(null);

      // Atualiza UI imediatamente
      sendMessage(newMessage);

      if (!token) throw new Error('Token de autenticação não encontrado.');

      const phoneNumber = selectedContact.number.replace(/\D/g, '');
      const formattedNumber = phoneNumber.startsWith('55') ? phoneNumber : `55${phoneNumber}`;
      if (formattedNumber.length < 12) throw new Error('Número de telefone inválido.');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'https://be.blinkdentalmarketing.com.br/api/v1'}/message/whats-app/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          clinic_id: 1,
          message: newMessage,
          phone_number: formattedNumber,
        }),
      });

      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
      setNewMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsSending(false);
    }
  }, [newMessage, isConnected, selectedContact, sendMessage, isSending, token]);

  // Scroll automático para novas mensagens
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;

    if (isNearBottom) {
      const timeout = setTimeout(() => scrollToBottom(), 50);
      return () => clearTimeout(timeout);
    }
  }, [allMessages, scrollToBottom]);

  const selectedPagination = selectedContact ? paginationByContact[selectedContact.number] || { hasMore: true, loading: false } : { hasMore: false, loading: false };

  return (
    <div className={styles.container}>
      {/* Contatos */}
      <div
        ref={contactsRef}
        className={styles.contacts}
        style={isMobile ? { transform: showContacts ? 'translateX(0)' : 'translateX(-100%)' } : {}}
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
          .filter(contact => contact.name?.toLowerCase().includes(searchTerm.toLowerCase()))
          .map(contact => (
            <div
              className={styles.contactCard}
              key={contact.id}
              onClick={() => { 
                setSelectedContact(contact); 
                if (isMobile) toggleMenu(); 
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
                  <p className={styles.lastMessage}>{contact.fromMe ? `${contact.lastMessage} ✓` : contact.lastMessage}</p>
                  <p className={styles.sentAt}>{formatDateTime(contact.sentAt)}</p>
                </div>
              </div>
            </div>
          ))
        }

        {loadingContacts && (
          <div className={styles.loader}>
            <p>Carregando...</p>
          </div>
        )}

        {hasMoreContacts && !loadingContacts && (
          <div className={styles.loader} onClick={loadMoreContacts}>
            <p>Carregar mais</p>
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
          {selectedPagination.hasMore && (
            <div className={styles.loaderTop} onClick={loadMoreMessages}>
              {selectedPagination.loading ? <p>Carregando mensagens...</p> : <p>Carregar mais</p>}
            </div>
          )}

          {allMessages.length === 0 && !selectedPagination.loading && (
            <div className={styles.noMessages}>Sem mensagens por enquanto.</div>
          )}
          
          {error && <div className={styles.errorMessage}>{error}</div>}
          
          <div className={styles.messageList}>
            {allMessages.map((message, index) => {
              const prevMessage = index > 0 ? allMessages[index - 1] : null;
              const showHeader = !prevMessage || prevMessage.user?.name !== message.user?.name;
              const displayMessage = message.user?.name === username ? `${message.content} ✓` : message.content;
              return (
                <div key={message.id} className={styles.messageItem}>
                  <ChatMessageItem
                    message={{ ...message, content: displayMessage, createdAt: formatDateTime(message.createdAt) }}
                    isOwnMessage={message.user?.name === username}
                    showHeader={showHeader}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSendMessage} className={styles.inputContainer}>
          <Input
            className={cn(styles.inputMessage, isConnected && newMessage.trim() ? styles.inputMessageActive : '')}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite a mensagem..."
            disabled={!isConnected || isSending}
          />
          {isConnected && newMessage.trim() && (
            <Button className={styles.sendButton} type="submit" disabled={ isSending}>
              {isSending ? 'Enviando...' : <Send className={styles.sendIcon} />}
            </Button>
          )}
        </form>
      </div>
    </div>
  );
};

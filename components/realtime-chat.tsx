'use client'

import { cn } from '@/lib/utils';
import { ChatMessageItem } from '@/components/chat-message';
import { useChatScroll } from '@/hooks/use-chat-scroll';
import { type ChatMessage, useRealtimeChat } from '@/hooks/use-realtime-chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Users, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './styles/realtime-chat.module.css';
import { Switch } from '@/components/ui/switch';
import Image from 'next/image';

// Tipagens
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
  initialMessages?: ChatPhoneConfig[];
  token?: string;
  apiBase: string; // recebido do SSR
}

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
  initialMessages = [],
  token,
  apiBase,
}: RealtimeChatProps) => {
  const { containerRef, scrollToBottom } = useChatScroll();

  // Mapeia dados iniciais
  const initialMappedContacts = useMemo(
    () =>
      initialContacts.map((c) => ({
        id: c.phone_number,
        name: c.whats_app_name || c.phone_number || 'Contato sem Identificação',
        number: c.phone_number || '',
        scheduled: c.ai_answer ?? false,
        photo: c.picture_url || '',
        lastMessage: c.last_message,
        sentAt: c.sent_at,
        fromMe: c.from_me,
        roomName: c.phone_number,
      })),
    [initialContacts]
  );

  const [contacts, setContacts] = useState<any[]>(initialMappedContacts);
  const [contactsPage, setContactsPage] = useState(0);
  const [contactsHasMore, setContactsHasMore] = useState(true);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  const initialMappedMessages = useMemo(
    () =>
      initialMessages.map((msg) => ({
        id: `${msg.sent_at}-${msg.from_me}-${msg.message_text}`,
        text: msg.message_text,
        content: msg.message_text,
        user: { name: msg.from_me ? username : (initialMappedContacts[0]?.name || 'Contato') },
        createdAt: msg.sent_at,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [initialMessages] // deliberado: username/contacts[0] não mudam durante mount
  );

  const [selectedContact, setSelectedContact] = useState<any>(initialMappedContacts[0] || null);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMappedMessages);
  const [messagesPage, setMessagesPage] = useState(0);
  const [messagesHasMore, setMessagesHasMore] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showContacts, setShowContacts] = useState(false);

  const { messages: realtimeMessages, sendMessage, isConnected } = useRealtimeChat({
    roomName: selectedContact?.roomName || '',
    username,
  });

  // --- Helpers
  const createApiHeaders = (tokenMaybe?: string) => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (tokenMaybe) h.Authorization = `Bearer ${tokenMaybe}`;
    return h;
  };

  // Unifica SSR + realtime (evita duplicatas por id)
  const allMessages = useMemo(() => {
    const merged = [...messages, ...realtimeMessages];
    const unique = merged.filter((m, i, self) => i === self.findIndex((x) => x.id === m.id));
    return unique.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [messages, realtimeMessages]);

  // Detecta mobile
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMenu = () => setShowContacts((p) => !p);

  // --- Carregar mais contatos (scroll bottom)
  const loadMoreContacts = async () => {
    if (!token || isLoadingContacts || !contactsHasMore) return;
    setIsLoadingContacts(true);
    try {
      const nextPage = contactsPage + 1;
      const url = `${apiBase}/chat/1/overview?page=${nextPage}`;
      console.log("[DEBUG] loadMoreContacts url:", url);
      const res = await fetch(url, { headers: createApiHeaders(token), cache: 'no-cache' });
      if (!res.ok) {
        console.warn("[DEBUG] loadMoreContacts status:", res.status);
        setIsLoadingContacts(false);
        return;
      }
      const data: ChatConfig[] = await res.json();
      if (!data || data.length === 0) {
        setContactsHasMore(false);
      } else {
        const mapped = data.map((c) => ({
          id: c.phone_number,
          name: c.whats_app_name || c.phone_number,
          number: c.phone_number,
          scheduled: c.ai_answer ?? false,
          photo: c.picture_url || '',
          lastMessage: c.last_message,
          sentAt: c.sent_at,
          fromMe: c.from_me,
          roomName: c.phone_number,
        }));
        setContacts((prev) => [...prev, ...mapped]);
        setContactsPage(nextPage);
      }
    } catch (err) {
      console.error("Erro ao carregar mais contatos", err);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  // --- Carregar mais mensagens (scroll topo). Preserva scroll.
  const loadMoreMessages = async () => {
    if (!token || !selectedContact || isLoadingMessages || !messagesHasMore) return;
    setIsLoadingMessages(true);
    try {
      const nextPage = messagesPage + 1;
      const phone = selectedContact.number || selectedContact.id || '';
      const url = `${apiBase}/chat/1/overview/${encodeURIComponent(phone)}?page=${nextPage}`;
      console.log("[DEBUG] loadMoreMessages url:", url);

      const container = containerRef.current;
      const prevScrollHeight = container?.scrollHeight ?? 0;
      const prevScrollTop = container?.scrollTop ?? 0;

      const res = await fetch(url, { headers: createApiHeaders(token), cache: 'no-cache' });
      if (!res.ok) {
        console.warn("[DEBUG] loadMoreMessages status:", res.status);
        setIsLoadingMessages(false);
        return;
      }
      const data: ChatPhoneConfig[] = await res.json();
      if (!data || data.length === 0) {
        setMessagesHasMore(false);
      } else {
        const mapped = data.map((msg) => ({
          id: `${msg.sent_at}-${msg.from_me}-${msg.message_text}`,
          text: msg.message_text,
          content: msg.message_text,
          user: { name: msg.from_me ? username : (selectedContact?.name || 'Contato') },
          createdAt: msg.sent_at,
        }));
        // Prepend
        setMessages((prev) => [...mapped, ...prev]);
        setMessagesPage(nextPage);

        // Preserva posição: espera o DOM atualizar antes de ajustar
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const newScrollHeight = container?.scrollHeight ?? 0;
            if (container) {
              container.scrollTop = newScrollHeight - prevScrollHeight + prevScrollTop;
            }
          });
        });
      }
    } catch (err) {
      console.error("Erro ao carregar mais mensagens", err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Scroll listeners
  const contactsRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = contactsRef.current;
    if (!el) return;
    const onScroll = () => {
      if (isLoadingContacts || !contactsHasMore) return;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
        loadMoreContacts();
      }
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactsPage, isLoadingContacts, contactsHasMore, token]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      if (isLoadingMessages || !messagesHasMore) return;
      if (el.scrollTop <= 20) {
        loadMoreMessages();
      }
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messagesPage, isLoadingMessages, messagesHasMore, selectedContact, token]);

  // Ao selecionar um contato, carrega página 0 para esse contato (reset)
  const handleSelectContact = async (contact: any) => {
    if (!contact) return;
    if (selectedContact?.id === contact.id) return;

    setSelectedContact(contact);
    setMessages([]);
    setMessagesPage(0);
    setMessagesHasMore(true);

    if (!token) return;

    setIsLoadingMessages(true);
    try {
      const phone = contact.number || contact.id || '';
      const url = `${apiBase}/chat/1/overview/${encodeURIComponent(phone)}?page=0`;
      console.log("[DEBUG] fetch messages (page 0) for contact:", url);
      const res = await fetch(url, { headers: createApiHeaders(token), cache: 'no-cache' });
      if (!res.ok) {
        console.warn("[DEBUG] fetch messages page0 status:", res.status);
        setIsLoadingMessages(false);
        return;
      }
      const data: ChatPhoneConfig[] = await res.json();
      const mapped = (data || []).map((msg) => ({
        id: `${msg.sent_at}-${msg.from_me}-${msg.message_text}`,
        text: msg.message_text,
        content: msg.message_text,
        user: { name: msg.from_me ? username : contact.name },
        createdAt: msg.sent_at,
      }));
      setMessages(mapped);
      setMessagesPage(0);
      // scroll to bottom after DOM paint
      requestAnimationFrame(() => scrollToBottom());
    } catch (err) {
      console.error("Erro ao carregar mensagens do contato:", err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Enviar mensagem
  const handleSendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMessage.trim() || !isConnected || !selectedContact || isSending) return;

      try {
        setIsSending(true);
        setError(null);
        sendMessage(newMessage); // envia via websocket/realtime

        if (!token) throw new Error('Token de autenticação não encontrado.');

        const phoneNumber = selectedContact.number.replace(/\D/g, '');
        const formattedNumber = phoneNumber.startsWith('55') ? phoneNumber : `55${phoneNumber}`;
        if (formattedNumber.length < 12) throw new Error('Número de telefone inválido.');

        const response = await fetch(`${apiBase}/message/whats-app/send-message`, {
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
    },
    [newMessage, isConnected, selectedContact, sendMessage, isSending, token, apiBase]
  );

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
            <input type="text" placeholder="Pesquisar por contato" />
          </div>
          <hr />
        </div>

        {contacts.map((contact) => (
          <div
            className={styles.contactCard}
            key={contact.id}
            onClick={() => { handleSelectContact(contact); if (isMobile) toggleMenu(); }}
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
        ))}

        {isLoadingContacts && <div style={{ padding: 12, textAlign: 'center' }}>Carregando mais contatos...</div>}
        {!contactsHasMore && <div style={{ padding: 12, textAlign: 'center', opacity: 0.7 }}>Fim da lista</div>}
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
          {isLoadingMessages && messages.length === 0 && <div className={styles.noMessages}>Carregando mensagens...</div>}
          {allMessages.length === 0 && !isLoadingMessages && <div className={styles.noMessages}>Sem mensagens por enquanto.</div>}
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

          {isLoadingMessages && messages.length > 0 && <div style={{ padding: 8, textAlign: 'center' }}>Carregando mensagens antigas...</div>}
          {!messagesHasMore && <div style={{ padding: 8, textAlign: 'center', opacity: 0.7 }}>Topo do histórico</div>}
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
            <Button className={styles.sendButton} type="submit" disabled={!isConnected || isSending}>
              {isSending ? 'Enviando...' : <Send className={styles.sendIcon} />}
            </Button>
          )}
        </form>
      </div>
    </div>
  );
};

'use client'

import { cn } from '@/lib/utils';
import { ChatMessageItem } from '@/components/chat-message';
import { useChatScroll } from '@/hooks/use-chat-scroll';
import { type ChatMessage, useRealtimeChat } from '@/hooks/use-realtime-chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Users, Search, Wifi, WifiOff } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import styles from './styles/realtime-chat.module.css'; // Certifique-se de ter este arquivo CSS
import { Switch } from '@/components/ui/switch';
import Image from 'next/image';

// Interfaces simplificadas (mantidas como no original)
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
  clinicId?: number; // Usa este clinicId para as chamadas API
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
  token,
  clinicId = 1, // Valor padrão para clinicId
}: RealtimeChatProps) => {
  const { containerRef, scrollToBottom } = useChatScroll();

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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesPage, setMessagesPage] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Novo estado
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Use o novo `connectionStatus` do hook
  const {
    messages: realtimeMessages,
    sendMessage,
    isConnected,
    connectionStatus, // Novo estado granular de conexão
  } = useRealtimeChat({
    roomName: selectedContact?.roomName || '',
    username,
    clinicId, // Passa o clinicId para o hook
  });

  // Junta mensagens SSR + realtime
  const allMessages = useMemo(() => {
    const merged = [...messages, ...realtimeMessages];
    const unique = merged.filter((m, i, self) => i === self.findIndex(msg => msg.id === m.id));
    return unique.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [messages, realtimeMessages]);

  // Detecta mobile
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMenu = () => setShowContacts(prev => !prev);

  // Função buscar mais contatos - usa clinicId
  const loadMoreContacts = async () => {
    if (!token || !hasMoreContacts || loadingContacts) return;
    try {
      setLoadingContacts(true);
      const nextPage = contactsPage + 1;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'https://be.blinkdentalmarketing.com.br/api/v1'}/chat/${clinicId}/overview?page=${nextPage}`, {
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

  // Função buscar mensagens ao selecionar contato - usa clinicId
  const fetchMessages = useCallback(async (pageToLoad: number = 0, reset: boolean = false) => {
    if (!token || !selectedContact) return;
    try {
      setLoadingMessages(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'https://be.blinkdentalmarketing.com.br/api/v1'}/chat/${clinicId}/overview/${selectedContact.number}?page=${pageToLoad}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data: ChatPhoneConfig[] = await res.json();
        if (data.length > 0) {
          const mappedMessages = data.map(msg => ({
            id: `${selectedContact.number}-${msg.sent_at}-${msg.from_me}`,
            text: msg.message_text,
            content: msg.message_text,
            user: { name: msg.from_me ? username : (selectedContact?.name || 'Contato') },
            createdAt: msg.sent_at,
            fromMe: msg.from_me,
          }));

          setMessages(prev => reset ? mappedMessages : [...mappedMessages, ...prev]);
          
          if (data.length < 20) { // Assumindo 20 mensagens por página
            setHasMoreMessages(false);
          }
        } else {
          setHasMoreMessages(false);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar mensagens", err);
      setHasMoreMessages(false);
    } finally {
      setLoadingMessages(false);
    }
  }, [token, selectedContact, username, clinicId]); // Adiciona clinicId às dependências

  // Função buscar mais mensagens (rolando para cima)
  const loadMoreMessages = async () => {
    if (!hasMoreMessages || loadingMessages || !containerRef.current) return;

    const el = containerRef.current;
    const prevScrollHeight = el.scrollHeight;
    const prevScrollTop = el.scrollTop;

    const nextPage = messagesPage + 1;
    setMessagesPage(nextPage);

    await fetchMessages(nextPage, false);

    // restaura posição do scroll
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
      setMessages([]);
      setMessagesPage(0);
      setHasMoreMessages(true);
      fetchMessages(0, true).then(() => {
        // garante que vai para o fim ao trocar de contato
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
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 700) { // Carrega 700px antes do fim
        loadMoreContacts();
      }
    };

    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [contactsPage, token, hasMoreContacts, loadingContacts, loadMoreContacts]); // Adiciona loadMoreContacts às dependências

  // Scroll mensagens -> topo carrega mais
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    
    const onScroll = () => {
      if (el.scrollTop <= 20 && !loadingMessages) { // Carrega quando o scroll está a 20px do topo
        loadMoreMessages();
      }
    };
    
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [messagesPage, token, selectedContact, hasMoreMessages, loadingMessages, loadMoreMessages]); // Adiciona loadMoreMessages às dependências

  // Enviar mensagem
  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact || isSending) return;

    try {
      setIsSending(true);
      setError(null);

      // Enviar via WebSocket
      const success = await sendMessage(newMessage);
      
      if (!success) {
        throw new Error('Erro ao enviar mensagem. Verifique a conexão.');
      }

      setNewMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao enviar mensagem');
    } finally {
      setIsSending(false);
    }
  }, [newMessage, selectedContact, sendMessage, isSending]);

  // Scroll automático para novas mensagens
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;

    // Se estiver perto do fim ou se a nova mensagem for minha, rola para baixo
    // Isso evita rolagem automática se o usuário estiver lendo mensagens antigas
    const lastMessage = allMessages[allMessages.length - 1];
    const isMyLastMessage = lastMessage?.fromMe || lastMessage?.user?.name === username;

    if (isNearBottom || isMyLastMessage) {
      const timeout = setTimeout(() => scrollToBottom(), 50);
      return () => clearTimeout(timeout);
    }
  }, [allMessages, scrollToBottom, username]);

  // Função para renderizar o status da conexão
  const renderConnectionStatus = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi size={16} className={styles.connected}  />;
      case 'connecting':
        return <span className={styles.connectingIndicator} ></span>;
      case 'disconnected':
        return <WifiOff size={16} className={styles.disconnected} />;
      case 'error':
        return <span className={styles.errorIndicator} >!</span>;
      default:
        return null;
    }
  };

  // Texto do placeholder do input
  const inputPlaceholder = useMemo(() => {
    switch (connectionStatus) {
      case 'connected':
        return "Digite a mensagem...";
      case 'connecting':
        return "Conectando...";
      case 'disconnected':
        return "Desconectado, tentando reconectar...";
      case 'error':
        return "Erro de conexão. Não é possível enviar.";
      default:
        return "Carregando...";
    }
  }, [connectionStatus]);

  // Desabilita o input e o botão de enviar se não estiver conectado ou estiver enviando
  const isInputDisabled = !isConnected || isSending || connectionStatus === 'error';

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
              <div className={styles.connectionStatus}>
                {renderConnectionStatus()} {/* Usa o novo renderConnectionStatus */}
              </div>
            </div>
          )}
          <Switch className={styles.switch} defaultChecked={selectedContact?.scheduled} />
        </div>

        <div ref={containerRef} className={styles.messages}>
          {hasMoreMessages && (
            <div className={styles.loaderTop} onClick={loadMoreMessages}>
              {loadingMessages ? <p>Carregando mensagens...</p> : <p>Carregar mais</p>}
            </div>
          )}

          {allMessages.length === 0 && !loadingMessages && (
            <div className={styles.noMessages}>
              {selectedContact ? 'Sem mensagens por enquanto.' : 'Selecione um contato para iniciar o chat.'}
            </div>
          )}
          
          {error && <div className={styles.errorMessage}>{error}</div>}
          
          <div className={styles.messageList}>
            {allMessages.map((message, index) => {
              const prevMessage = index > 0 ? allMessages[index - 1] : null;
              const showHeader = !prevMessage || prevMessage.user?.name !== message.user?.name;
              const displayMessage = message.fromMe ? `${message.content} ✓` : message.content;
              return (
                <div key={message.id} className={styles.messageItem}>
                  <ChatMessageItem
                    message={{ ...message, content: displayMessage, createdAt: formatDateTime(message.createdAt) }}
                    isOwnMessage={message.fromMe || message.user?.name === username}
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
            placeholder={inputPlaceholder} // Usa o novo placeholder dinâmico
            disabled={isInputDisabled} // Usa o novo estado de desabilitação
          />
          {isConnected && newMessage.trim() && ( // Mostra o botão de enviar apenas se conectado e houver mensagem
            <Button className={styles.sendButton} type="submit" disabled={isInputDisabled}>
              {isSending ? 'Enviando...' : <Send className={styles.sendIcon} />}
            </Button>
          )}
        </form>
      </div>
    </div>
  );
};

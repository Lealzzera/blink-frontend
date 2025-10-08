'use client'

import { cn } from '@/lib/utils';
import { ChatMessageItem } from '@/components/chat-message';
import { useChatScroll } from '@/hooks/use-chat-scroll';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Users, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import styles from './styles/realtime-chat.module.css';
import { Switch } from '@/components/ui/switch';
import Image from 'next/image';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useMyContext } from "../app/context/context";

// A interface ChatMessage foi movida para cá para desacoplar do hook.
export interface ChatMessage {
  id: string;
  text: string;
  content: string;
  user: { name: string };
  createdAt: string;
}

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
  id?: string;
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

const generateTempId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `temp-${(crypto as any).randomUUID()}`;
  }
  return `temp-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
};

export const RealtimeChat = ({
  username,
  initialContacts = [],
  token,
}: RealtimeChatProps) => {
  const { containerRef, scrollToBottom } = useChatScroll();

  // Context
  const {value} = useMyContext()


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

  const stompClientRef = useRef<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Função para atualizar a lista de contatos quando uma nova mensagem chega
  const updateContactsList = useCallback((contactNumber: string, newMessageText: string, isFromMe: boolean, sentAt: string) => {
    setContacts(prevContacts => {
      // Verifica se o contato já existe na lista
      const existingContactIndex = prevContacts.findIndex(contact => contact.number === contactNumber);
      
      if (existingContactIndex >= 0) {
        // Contato existe - move para o topo e atualiza a última mensagem
        const updatedContacts = [...prevContacts];
        const contactToUpdate = { ...updatedContacts[existingContactIndex] };
        
        // Atualiza os dados do contato
        contactToUpdate.lastMessage = newMessageText;
        contactToUpdate.sentAt = sentAt;
        contactToUpdate.fromMe = isFromMe;
        
        // Remove da posição atual e adiciona no início
        updatedContacts.splice(existingContactIndex, 1);
        return [contactToUpdate, ...updatedContacts];
      } else {
        // Contato novo - adiciona no topo
        const newContact = {
          id: contactNumber,
          name: contactNumber, // Usa o número como nome padrão
          number: contactNumber,
          scheduled: false,
          photo: '',
          lastMessage: newMessageText,
          sentAt: sentAt,
          fromMe: isFromMe,
          roomName: contactNumber,
        };
        
        return [newContact, ...prevContacts];
      }
    });
  }, []);

  useEffect(() => {
    console.log("[WebSocket useEffect] Inicializando...");

    if (!token || !username) {
      console.warn("[WebSocket useEffect] Token ou username ausente:", { token, username });
      return;
    }

    try {
      console.log("[WebSocket useEffect] Criando conexão SockJS...");
      const socket = new SockJS(`https://be.blinkdentalmarketing.com.br/wpp-socket/subscribe?token=Bearer%20${token}`);

      console.log("[WebSocket useEffect] Criando cliente STOMP...");
      const client = new Client({
        webSocketFactory: () => {
          console.log("[WebSocket useEffect] Chamando webSocketFactory...");
          return socket;
        },
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        debug: (str) => {
          console.log("[STOMP DEBUG]", str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,

        onConnect: () => {
          console.log("[WebSocket useEffect] ✅ STOMP conectado com sucesso!");
          setIsConnected(true);
          setError(null);

          const subscriptionTopic = `/user/${username}/notify/message-received`;
          console.log("[WebSocket useEffect] Tentando se inscrever no tópico:", subscriptionTopic);

          try {
            client.subscribe(subscriptionTopic, (message) => {
              console.log("[STOMP Subscription] Mensagem bruta recebida:", message);

              try {
                const receivedMessage = JSON.parse(message.body);
                console.log("[STOMP Subscription] Mensagem parseada:", receivedMessage);

                // Compatibilidade: tenta pegar os campos em ambos os formatos
                const contactNumber =
                  receivedMessage.phone_number || receivedMessage.sender;

                const text =
                  receivedMessage.message_text || receivedMessage.message;

                const sentAt =
                  receivedMessage.sent_at || new Date().toISOString();

                const isFromMe = receivedMessage.from_me || false;

                if (!contactNumber || !text) {
                  console.error(
                    "[STOMP Subscription] ❌ Mensagem recebida sem campos essenciais:",
                    receivedMessage
                  );
                  return;
                }

                const newChatMessage: ChatMessage = {
                  id:
                    receivedMessage.id ||
                    `${contactNumber}-${Date.now()}-${Math.random()}`,
                  text,
                  content: text,
                  user: {
                    name: isFromMe ? username : contactNumber,
                  },
                  createdAt: sentAt,
                };

                console.log(
                  "[STOMP Subscription] Criando nova mensagem no estado:",
                  newChatMessage
                );

                // Atualiza a lista de contatos (move para o topo e atualiza última mensagem)
                updateContactsList(contactNumber, text, isFromMe, sentAt);

                // Adiciona a mensagem ao estado de mensagens
                setMessagesByContact((prev) => {
                  const currentMessages = prev[contactNumber] || [];

                  // evitar duplicados
                  if (currentMessages.some((m) => m.id === newChatMessage.id)) {
                    console.warn(
                      "[STOMP Subscription] ⚠️ Mensagem duplicada detectada, ignorando:",
                      newChatMessage.id
                    );
                    return prev;
                  }

                  return {
                    ...prev,
                    [contactNumber]: [...currentMessages, newChatMessage],
                  };
                });
              } catch (err) {
                console.error(
                  "[STOMP Subscription] ❌ Erro ao parsear/processar mensagem:",
                  err,
                  message.body
                );
              }
            });

          } catch (subErr) {
            console.error("[WebSocket useEffect] ❌ Erro ao tentar se inscrever no tópico:", subErr);
          }
        },

        onStompError: (frame) => {
          console.error("[WebSocket useEffect] ❌ Erro do broker STOMP:", {
            headers: frame?.headers,
            body: frame?.body,
          });
          setError("Erro de conexão com o chat em tempo real. Tentando reconectar...");
          setIsConnected(false);
        },

        onWebSocketError: (event) => {
          console.error("[WebSocket useEffect] ❌ Erro no WebSocket:", event);
          setError("Erro na conexão WebSocket. Verifique o console para detalhes.");
          setIsConnected(false);
        },

        onWebSocketClose: () => {
          console.warn("[WebSocket useEffect] ⚠️ Conexão WebSocket fechada. Tentando reconectar...");
          setIsConnected(false);
        },
      });

      stompClientRef.current = client;
      console.log("[WebSocket useEffect] Ativando cliente STOMP...");
      client.activate();
    } catch (err) {
      console.error("[WebSocket useEffect] ❌ Erro ao inicializar STOMP:", err);
    }

    return () => {
      console.log("[WebSocket useEffect] Cleanup executado. Desativando cliente STOMP...");
      if (stompClientRef.current?.active) {
        stompClientRef.current.deactivate();
      }
    };
  }, [token, username, updateContactsList]);

  // Junta mensagens e ordena
  const allMessages = useMemo(() => {
    const msgs = messagesByContact[selectedContact?.number || ''] || [];
    const unique = msgs.filter((m, i, self) => i === self.findIndex(msg => msg.id === m.id));
    return unique.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [messagesByContact, selectedContact]);

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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'https://be.blinkdentalmarketing.com.br/api/v1'}/chat/${value}/overview?page=${nextPage}`, {
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

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || `https://be.blinkdentalmarketing.com.br/api/v1`}/chat/${value}/overview/${contactNumber}?page=${pageToLoad}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data: ChatPhoneConfig[] = await res.json();
        if (data.length > 0) {
          const mappedMessages: ChatMessage[] = data.map(msg => ({
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

  // Enviar mensagem (corrigido: não depende exclusivamente de isConnected; faz envio otimista)
  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact || isSending) return;

    try {
      setIsSending(true);
      setError(null);

      if (!token) throw new Error('Token de autenticação não encontrado.');

      const phoneNumber = selectedContact.number.replace(/\D/g, '');
      const formattedNumber = phoneNumber.startsWith('55') ? phoneNumber : `55${phoneNumber}`;
      if (formattedNumber.length < 12) throw new Error('Número de telefone inválido.');

      // Mensagem otimista (aparece imediatamente)
      const optimisticId = generateTempId();
      const optimisticMessage: ChatMessage = {
        id: optimisticId,
        text: newMessage,
        content: newMessage,
        user: { name: username },
        createdAt: new Date().toISOString(),
      };

      // Atualiza a lista de contatos quando o usuário envia uma mensagem
      updateContactsList(selectedContact.number, newMessage, true, new Date().toISOString());

      setMessagesByContact(prev => {
        const curr = prev[selectedContact.number] || [];
        return { ...prev, [selectedContact.number]: [...curr, optimisticMessage] };
      });

      // Requisição para enviar a mensagem
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

      // tenta ler resposta e, caso retorne id, substitui o id temporário
      let resData: any = null;
      try { resData = await response.json(); } catch { resData = null; }

      if (resData && resData.id) {
        setMessagesByContact(prev => {
          const list = prev[selectedContact.number] || [];
          return {
            ...prev,
            [selectedContact.number]: list.map(m => m.id === optimisticId ? { ...m, id: resData.id, createdAt: resData.sent_at ?? m.createdAt } : m)
          };
        });
      }

      setNewMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');

      // remove mensagens temporárias ao falhar
      setMessagesByContact(prev => {
        const list = prev[selectedContact.number] || [];
        return { ...prev, [selectedContact.number]: list.filter(m => !String(m.id).startsWith('temp-')) };
      });
    } finally {
      setIsSending(false);
    }
  }, [newMessage, selectedContact, isSending, token, username, updateContactsList]);

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

  // botão aparece quando temos token, contato e texto
  const canSend = Boolean(token && selectedContact && newMessage.trim());

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
          <div className={styles.loaderContainer}>
            <span className={styles.loaderText}>Carregando...</span>
          </div>
        )}

        {hasMoreContacts && !loadingContacts && (
          <div className={styles.loaderContainer} onClick={loadMoreContacts}>
            <span className={styles.loaderLink}>Carregar mais</span>
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
            placeholder={!selectedContact ? "Selecione um contato para começar" : (!token ? "Token ausente" : "Digite a mensagem...")}
            disabled={!selectedContact || isSending}
          />
          {canSend && (
            <Button className={styles.sendButton} type="submit" disabled={ isSending }>
              {isSending ? 'Enviando...' : <Send className={styles.sendIcon} />}
            </Button>
          )}
        </form>
      </div>
    </div>
  );
};
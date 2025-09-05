'use client'

import { cn } from '@/lib/utils';
import { ChatMessageItem } from '@/components/chat-message';
import { useChatScroll } from '@/hooks/use-chat-scroll';
import { type ChatMessage, useRealtimeChat } from '@/hooks/use-realtime-chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Users, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './styles/realtime-chat.module.css';
import { Switch } from '@/components/ui/switch';
import Image from 'next/image';
import { type ChatConfig, type ChatPhoneConfig } from '@/app/services/chatService';

interface RealtimeChatProps {
  username: string;
  initialContacts?: ChatConfig[];
  initialMessages?: ChatPhoneConfig[];
  token?: string;
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
}: RealtimeChatProps) => {
  const { containerRef, scrollToBottom } = useChatScroll();

  const [contacts, setContacts] = useState<any[]>(initialContacts.map(c => ({
    id: c.phone_number,
    name: c.whats_app_name || c.phone_number || 'Contato sem Identificação',
    number: c.phone_number || '',
    scheduled: c.ai_answer ?? false,
    photo: c.picture_url || '',
    lastMessage: c.last_message,
    sentAt: c.sent_at,
    fromMe: c.from_me,
    roomName: c.phone_number,
  })));

  const [selectedContact, setSelectedContact] = useState<any>(contacts[0] || null);

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages.map(msg => ({
    id: `${msg.sent_at}-${msg.from_me}-${msg.message_text}`,
    text: msg.message_text,
    content: msg.message_text,
    user: { name: msg.from_me ? username : (contacts[0]?.name || 'Contato') },
    createdAt: msg.sent_at,
  })));

  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showContacts, setShowContacts] = useState(false);

  const { messages: realtimeMessages, sendMessage, isConnected } = useRealtimeChat({
    roomName: selectedContact?.roomName || '',
    username,
  });

  const allMessages = useMemo(() => {
    const merged = [...messages, ...realtimeMessages];
    const unique = merged.filter((m, i, self) => i === self.findIndex(msg => msg.id === m.id));
    return unique.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [messages, realtimeMessages]);

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

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !isConnected || !selectedContact || isSending) return;

    try {
      setIsSending(true);
      setError(null);
      sendMessage(newMessage);

      if (!token) throw new Error('Token de autenticação não encontrado.');

      const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';
      const phoneNumber = selectedContact.number.replace(/\D/g, '');
      const formattedNumber = phoneNumber.startsWith('55') ? phoneNumber : `55${phoneNumber}`;
      if (formattedNumber.length < 12) throw new Error('Número de telefone inválido.');

      const response = await fetch(`${API_BASE}/message/whats-app/send-message`, {
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

  return (
    <div className={styles.container}>
      {/* Contatos */}
      <div className={styles.contacts} style={isMobile ? { transform: showContacts ? 'translateX(0)' : 'translateX(-100%)' } : {}}>
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

        {contacts.map(contact => (
          <div
            className={styles.contactCard}
            key={contact.id}
            onClick={() => { setSelectedContact(contact); if (isMobile) toggleMenu(); }}
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
          {allMessages.length === 0 && <div className={styles.noMessages}>Sem mensagens por enquanto.</div>}
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
            <Button className={styles.sendButton} type="submit" disabled={!isConnected || isSending}>
              {isSending ? 'Enviando...' : <Send className={styles.sendIcon} />}
            </Button>
          )}
        </form>
      </div>
    </div>
  );
};

'use client';

import { getConversationMessages } from '@/app/actions/getConversationMessages';
import { postMessage } from '@/app/actions/postMessage';
import { putAiAnswer } from '@/app/actions/putAiAnswer';
import SwitchComponent from '@/app/components/SwitchComponent/SwitchComponent';
import { useChat } from '@/app/context/chatContext';
import { useUser } from '@/app/context/userContext';
import { Send } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import MessageComponent from '../MessageComponent/MessageComponent';
import style from './style.module.css';

type ChatComponentProps = {
  phoneNumber: string;
  contactName?: string;
  imageUrl?: string;
  aiAnswerOn: boolean;
  contactId: string;
};

function getMessageText(message: any) {
  return message.message ?? message.message_text ?? '';
}

function isSameMessage(currentMessage: any, nextMessage: any) {
  if (currentMessage.id && nextMessage.id && !String(currentMessage.id).startsWith('local:')) {
    return currentMessage.id === nextMessage.id;
  }

  const hasSameText = getMessageText(currentMessage) === getMessageText(nextMessage);
  const hasSameDirection = currentMessage.from_me === nextMessage.from_me;
  const sentAtDifferenceInMs = Math.abs(
    new Date(currentMessage.sent_at).getTime() - new Date(nextMessage.sent_at).getTime(),
  );

  if (currentMessage.from_me && nextMessage.from_me) {
    return hasSameText && sentAtDifferenceInMs <= 10000;
  }

  return (
    currentMessage.sent_at === nextMessage.sent_at &&
    hasSameText &&
    hasSameDirection
  );
}

function getPendingMessageKey(phoneNumber: string, text: string) {
  return `${phoneNumber}:${text.trim()}`;
}

export default function ChatComponent({
  phoneNumber,
  contactName,
  imageUrl,
  aiAnswerOn,
  contactId,
}: ChatComponentProps) {
  const { clinicInfo } = useUser();

  const [loading, setLoading] = useState(false);
  const [messageList, setMessageList] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [message, setMessage] = useState('');
  const [pageNumber, setPageNumber] = useState(0);
  const [isSwitchOn, setIsSwitchOn] = useState(aiAnswerOn);
  const { lastMessageByPhone } = useChat();

  const chatRef = useRef<HTMLDivElement | null>(null);
  const ulRef = useRef<HTMLUListElement | null>(null);

  const prevScrollTopRef = useRef(0);
  const prevScrollHeightRef = useRef(0);
  const shouldScrollToBottomAfterNewMessageRef = useRef(false);
  const pendingLocalMessagesRef = useRef<Record<string, string>>({});

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const maxHeight = 150;

  const fetchMore = () => {
    if (!hasMore || loading) return;
    fetchMessageList(pageNumber + 1);
  };

  const firstListItem = useCallback(
    (node: HTMLLIElement | null) => {
      if (loading) return;

      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (entry.isIntersecting && hasMore && !loading) {
            fetchMore();
          }
        },
        {
          threshold: 0,
          root: chatRef.current,
        },
      );

      if (node) observer.current.observe(node);
    },
    [loading, hasMore],
  );

  const fetchMessageList = useCallback(
    async (page: number) => {
      if (!phoneNumber || loading) return;
      if (page > 0 && ulRef.current) {
        prevScrollHeightRef.current = ulRef.current.scrollHeight;
        prevScrollTopRef.current = ulRef.current.scrollTop;
      }

      setLoading(true);
      try {
        const response = await getConversationMessages({
          phoneNumber,
          page,
        });

        if (!response || response.length === 0) {
          setHasMore(false);
          return;
        }

        const sortedResponse = [...response].sort(
          (a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime(),
        );

        if (page === 0) {
          setMessageList(sortedResponse);
        }

        if (page > 0) {
          setMessageList((prev) => {
            const merged = [...sortedResponse, ...prev];

            const unique = merged.filter(
              (msg, index, arr) => arr.findIndex((m) => m.sent_at === msg.sent_at) === index,
            );

            return unique.sort(
              (a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime(),
            );
          });
        }

        setPageNumber(page);
      } catch (err) {
        console.error('Error fetching messages:', err);
      } finally {
        setLoading(false);
      }
    },
    [phoneNumber, loading],
  );

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    const value = event.target.value;
    setMessage(value);
    if (!textarea) return;
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
  };
  const handleSendMessage = async () => {
    if (!contactId || message.length === 0) return;
    if (!clinicInfo) return;
    if (!message.trim()) return;

    setMessage('');

    const localMessageId = `local:${Date.now()}`;
    const newMessage = {
      id: localMessageId,
      message,
      message_text: message,
      from_me: true,
      sent_at: new Date().toISOString(),
      is_local: true,
    };

    pendingLocalMessagesRef.current[getPendingMessageKey(phoneNumber, message)] = localMessageId;
    shouldScrollToBottomAfterNewMessageRef.current = true;
    setMessageList((prev) => [...prev, newMessage]);

    // TODO: IMPLEMENT IT WHEN WAHA IS READY
    // await postMessage({ chatId: contactId, text: message, session: clinicInfo.clinicId });
    await postMessage({ chatId: contactId, text: message, session: 'default' });

    if (textareaRef.current) {
      textareaRef.current.style.height = '40px';
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && event.shiftKey) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    if (!phoneNumber) return;
    setMessageList([]);
    setPageNumber(0);
    setHasMore(true);
    fetchMessageList(0);
  }, [phoneNumber]);

  useEffect(() => {
    setIsSwitchOn(aiAnswerOn);
  }, [aiAnswerOn, phoneNumber]);

  useEffect(() => {
    const container = ulRef.current;
    if (!container || messageList.length === 0) return;

    if (pageNumber === 0) {
      container.scrollTop = container.scrollHeight;
      return;
    }

    if (pageNumber > 0 && prevScrollHeightRef.current !== 0) {
      const newScrollHeight = container.scrollHeight;
      const oldScrollHeight = prevScrollHeightRef.current;
      const oldScrollTop = prevScrollTopRef.current;

      const heightDifference = newScrollHeight - oldScrollHeight;

      container.scrollTop = oldScrollTop + heightDifference;

      prevScrollHeightRef.current = 0;
      prevScrollTopRef.current = 0;
    }
  }, [messageList, pageNumber]);

  useEffect(() => {
    const latestMessage = lastMessageByPhone[phoneNumber];
    if (!latestMessage) return;

    setMessageList((prev) => {
      const alreadyExists = prev.some((message) => isSameMessage(message, latestMessage));

      if (alreadyExists) return prev;

      if (latestMessage.from_me) {
        const pendingMessageKey = getPendingMessageKey(phoneNumber, latestMessage.message);
        const pendingLocalMessageId = pendingLocalMessagesRef.current[pendingMessageKey];

        if (pendingLocalMessageId) {
          const nextMessageList = prev.map((message) =>
            message.id === pendingLocalMessageId
              ? {
                  ...latestMessage,
                  message_text: latestMessage.message,
                }
              : message,
          );

          delete pendingLocalMessagesRef.current[pendingMessageKey];
          shouldScrollToBottomAfterNewMessageRef.current = true;
          return nextMessageList;
        }
      }

      shouldScrollToBottomAfterNewMessageRef.current = true;
      return [...prev, latestMessage];
    });
  }, [lastMessageByPhone, phoneNumber]);

  useEffect(() => {
    if (!shouldScrollToBottomAfterNewMessageRef.current) return;

    const container = ulRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth',
    });

    shouldScrollToBottomAfterNewMessageRef.current = false;
  }, [messageList]);

  return (
    <div ref={chatRef} className={style.chatContainer}>
      <div className={style.contactInfo}>
        <div className={style.contactInfoContainer}>
          <div className={style.contactInfoText}>
            <p>{contactName}</p>
            {contactName ? <span>{phoneNumber}</span> : ''}
          </div>
          <Image
            alt="Imagem de perfil do contato"
            src={imageUrl ? imageUrl : '/images/avatar.png'}
            width={50}
            height={50}
            className={style.imageContact}
          />
        </div>
        <SwitchComponent
          isOn={isSwitchOn}
          handleToggle={async () => {
            try {
              const newValue = await putAiAnswer(phoneNumber);
              setIsSwitchOn(newValue);
            } catch (err) {
              console.error('Error toggling AI answer:', err);
            }
          }}
          label={isSwitchOn ? 'Desligar IA' : 'Ligar IA'}
        />
      </div>
      {loading && pageNumber > 0 && (
        <div className={style.dots}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      )}
      <ul ref={ulRef} className={style.chatUl}>
        {messageList.map((message, index) => {
          const isFirst = index === 0;
          return (
            <li
              key={index}
              ref={isFirst ? firstListItem : null}
              className={message.from_me ? style.fromMe : style.fromPatient}
            >
              <MessageComponent message={message} />
            </li>
          );
        })}
      </ul>

      <div className={style.textAreaContainer}>
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className={style.textArea}
          placeholder="Digite sua mensagem..."
        />
        <button onClick={handleSendMessage} className={style.textAreaButton}>
          <Send className={style.buttonIcon} />
        </button>
      </div>
    </div>
  );
}

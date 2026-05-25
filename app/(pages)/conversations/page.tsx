'use client';

import { fetchChatOverview } from '@/app/actions/fetchChatOverview';
import { useChat } from '@/app/context/chatContext';
import { useUser } from '@/app/context/userContext';
import { useWhatsApp } from '@/app/hooks/useWhatsApp';
import { ChatListItem } from '@/app/types/types';
import { useCallback, useEffect, useRef, useState } from 'react';
import ChatComponent from './components/ChatComponent/ChatComponent';
import ChatListComponent from './components/ChatListComponent/ChatListComponent';
import style from './style.module.css';

const LIMIT = 20;

function getInitialUnreadCount(chat: ChatListItem) {
  if (chat.unreadCount && chat.unreadCount > 0) {
    return chat.unreadCount;
  }

  const lastMessageAck = chat.lastMessage.ack;
  const isLastMessageFromMe = Boolean(chat.lastMessage.fromMe);

  if (lastMessageAck === 2 && !isLastMessageFromMe) {
    return 1;
  }

  return 0;
}

export default function Conversations() {
  const { whatsAppStatus } = useWhatsApp();
  const { contactSelected, clinicInfo } = useUser();
  const { hydrateUnreadCounts, latestChatMessage } = useChat();

  const [page, setPage] = useState(0);
  const [conversations, setConversations] = useState<ChatListItem[]>([]);
  const [loading, setLoading] = useState({
    firstLoading: true,
    loading: false,
  });
  const [hasMore, setHasMore] = useState(true);
  const isLoadingRef = useRef(false);

  const showWhatsAppIsNotConnected =
    whatsAppStatus?.status !== 'CONNECTED' &&
    whatsAppStatus?.status !== 'WORKING' &&
    !loading.firstLoading &&
    !loading.loading;

  const fetchConversations = useCallback(
    async (pageNum: number) => {
      if (!clinicInfo?.clinicId) return;
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;
      setLoading({ firstLoading: pageNum === 0, loading: pageNum > 0 });
      try {
        //TODO: IMPLEMENT THIS METHOD WHEN WAHA IS READY
        // const response = await fetchChatOverview({
        //   sessionName: clinicInfo?.clinicId,
        //   pagination: { limit: LIMIT, offset: pageNum * LIMIT },
        // });

        const response = await fetchChatOverview({
          sessionName: 'default',
          pagination: { limit: LIMIT, offset: pageNum * LIMIT },
        });

        const chatOverview = response as ChatListItem[];

        if (!chatOverview.length) {
          setHasMore(false);
          isLoadingRef.current = false;
          setLoading({ firstLoading: false, loading: false });
          return;
        }

        const unreadCountsByPhone = chatOverview.reduce<Record<string, number>>(
          (accumulator, chat) => {
            accumulator[chat.phoneNumber] = getInitialUnreadCount(chat);
            return accumulator;
          },
          {},
        );

        hydrateUnreadCounts(unreadCountsByPhone);

        setConversations((prev) => {
          const merged = [...prev, ...chatOverview];
          return merged;
        });
        setPage(pageNum);
        isLoadingRef.current = false;
        setLoading({ firstLoading: false, loading: false });
      } catch (error) {
        console.error(error);
        isLoadingRef.current = false;
        setLoading({ firstLoading: false, loading: false });
      }
    },
    [clinicInfo?.clinicId, hydrateUnreadCounts],
  );

  useEffect(() => {
    fetchConversations(0);
  }, [clinicInfo?.clinicId]);

  useEffect(() => {
    const lastMessage = latestChatMessage;

    if (!lastMessage) return;

    const sentAt = Math.floor(new Date(lastMessage.sent_at).getTime() / 1000);

    setConversations((prev) => {
      const existingConversationIndex = prev.findIndex(
        (conversation) => conversation.phoneNumber === lastMessage.phone_number,
      );

      const updatedConversation: ChatListItem = {
        id: lastMessage.chat_id ?? lastMessage.phone_number,
        phoneNumber: lastMessage.phone_number,
        contactName: lastMessage.contact_name || lastMessage.phone_number,
        contactPicture: lastMessage.contact_picture || '',
        ai_answer: true,
        lastMessage: {
          message: lastMessage.message,
          hasMedia: Boolean(lastMessage.has_media),
          sentAt: String(sentAt),
        },
      };

      if (existingConversationIndex === -1) {
        return [updatedConversation, ...prev];
      }

      const nextConversations = [...prev];
      const existingConversation = nextConversations[existingConversationIndex];

      nextConversations.splice(existingConversationIndex, 1);

      return [
        {
          ...existingConversation,
          contactName:
            existingConversation.contactName ||
            updatedConversation.contactName,
          contactPicture:
            existingConversation.contactPicture ||
            updatedConversation.contactPicture,
          lastMessage: updatedConversation.lastMessage,
        },
        ...nextConversations,
      ];
    });
  }, [latestChatMessage]);

  const handleFetchMore = useCallback(() => {
    if (!hasMore || isLoadingRef.current) return;
    fetchConversations(page + 1);
  }, [hasMore, page, fetchConversations]);

  return (
    <section className={style.conversationPageContainer}>
      {
        <ChatListComponent
          chatList={conversations}
          fetchMore={handleFetchMore}
          hasMore={hasMore}
          numberNotConnected={showWhatsAppIsNotConnected}
          loading={loading}
        />
      }

      {contactSelected?.id ? (
        <ChatComponent
          aiAnswerOn={true}
          contactName={contactSelected.contactName}
          phoneNumber={contactSelected.phoneNumber}
          imageUrl={contactSelected.contactPicture}
          contactId={contactSelected.id}
        />
      ) : (
        <div className={style.containerText}>
          <p>Crie uma conversa e começe a enviar e receber mensagens agora mesmo!</p>
        </div>
      )}
    </section>
  );
}

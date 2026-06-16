'use client';

import { fetchChatOverview } from '@/app/actions/fetchChatOverview';
import { getWhatsappConversationsList } from '@/app/actions/getWhatsappConversationsList';
import { useChat } from '@/app/context/chatContext';
import { useUser } from '@/app/context/userContext';
import { useWhatsApp } from '@/app/hooks/useWhatsApp';
import { ChatListItem } from '@/app/types/types';
import { useCallback, useEffect, useRef, useState } from 'react';
import ChatComponent from './components/ChatComponent/ChatComponent';
import ChatListComponent from './components/ChatListComponent/ChatListComponent';
import style from './style.module.css';

const LIMIT = 20;

type WhatsappConversationConfig = {
  id: string;
  chatId: string;
  phoneNumber: string;
  aiEnabled: boolean;
};

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

function mergeConversationsByPhoneNumber(
  currentConversations: ChatListItem[],
  nextConversations: ChatListItem[],
) {
  const conversationsByPhoneNumber = new Map<string, ChatListItem>();

  for (const conversation of currentConversations) {
    conversationsByPhoneNumber.set(conversation.phoneNumber, conversation);
  }

  for (const conversation of nextConversations) {
    const existingConversation = conversationsByPhoneNumber.get(conversation.phoneNumber);

    if (!existingConversation) {
      conversationsByPhoneNumber.set(conversation.phoneNumber, conversation);
      continue;
    }

    conversationsByPhoneNumber.set(conversation.phoneNumber, {
      ...existingConversation,
      ...conversation,
      contactName: existingConversation.contactName || conversation.contactName,
      contactPicture: existingConversation.contactPicture || conversation.contactPicture,
      lastMessage:
        Number(conversation.lastMessage?.sentAt ?? 0) >=
        Number(existingConversation.lastMessage?.sentAt ?? 0)
          ? conversation.lastMessage
          : existingConversation.lastMessage,
      unreadCount: conversation.unreadCount ?? existingConversation.unreadCount,
    });
  }

  return Array.from(conversationsByPhoneNumber.values()).sort(
    (firstConversation, secondConversation) =>
      Number(secondConversation.lastMessage?.sentAt ?? 0) -
      Number(firstConversation.lastMessage?.sentAt ?? 0),
  );
}

export default function Conversations() {
  const { whatsAppStatus, loading: whatsAppLoading } = useWhatsApp();
  const { contactSelected, clinicInfo, handleSetContactSelected } = useUser();
  const { hydrateUnreadCounts, latestChatMessage } = useChat();

  const [page, setPage] = useState(0);
  const [conversations, setConversations] = useState<ChatListItem[]>([]);
  const [whatsappConversationList, setWhatsappConversationList] = useState<
    WhatsappConversationConfig[]
  >([]);
  const [loading, setLoading] = useState({
    firstLoading: true,
    loading: false,
  });
  const [hasMore, setHasMore] = useState(true);
  const isLoadingRef = useRef(false);
  const isWhatsAppConnected = Boolean(whatsAppStatus?.connected);

  const showWhatsAppIsNotConnected =
    !whatsAppLoading &&
    !isWhatsAppConnected &&
    !loading.firstLoading &&
    !loading.loading;

  const fetchWhatsappConversationsList = useCallback(async (clinicId: string) => {
    try {
      const response = await getWhatsappConversationsList(clinicId);
      setWhatsappConversationList(response.conversations ?? response.data ?? []);
    } catch (error) {
      console.error('Failed to load WhatsApp conversations config', error);
      setWhatsappConversationList([]);
    }
  }, []);

  const handleWhatsappConversationConfigChange = useCallback(
    async (conversation: WhatsappConversationConfig) => {
      setWhatsappConversationList((prev) => {
        const existingConversationIndex = prev.findIndex(
          (item) => item.id === conversation.id || item.chatId === conversation.chatId,
        );

        if (existingConversationIndex === -1) {
          return [...prev, conversation];
        }

        const nextConversationList = [...prev];
        nextConversationList[existingConversationIndex] = {
          ...nextConversationList[existingConversationIndex],
          ...conversation,
        };

        return nextConversationList;
      });

      if (clinicInfo?.clinicId) {
        await fetchWhatsappConversationsList(clinicInfo.clinicId);
      }
    },
    [clinicInfo?.clinicId, fetchWhatsappConversationsList],
  );

  const fetchConversations = useCallback(
    async (pageNum: number) => {
      if (!clinicInfo?.clinicId) return;
      if (!isWhatsAppConnected) return;
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

        const unreadCountsByPhone = chatOverview.reduce<
          Record<string, { count: number; lastMessageSentAt?: string }>
        >(
          (accumulator, chat) => {
            accumulator[chat.phoneNumber] = {
              count: getInitialUnreadCount(chat),
              lastMessageSentAt: chat.lastMessage.sentAt,
            };
            return accumulator;
          },
          {},
        );

        hydrateUnreadCounts(unreadCountsByPhone);

        setConversations((prev) => {
          if (pageNum === 0) {
            return mergeConversationsByPhoneNumber(prev, chatOverview);
          }

          return mergeConversationsByPhoneNumber(prev, chatOverview);
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
    [clinicInfo?.clinicId, hydrateUnreadCounts, isWhatsAppConnected],
  );

  useEffect(() => {
    if (!clinicInfo?.clinicId) return;

    if (whatsAppLoading) {
      setLoading({ firstLoading: true, loading: false });
      return;
    }

    if (!isWhatsAppConnected) {
      isLoadingRef.current = false;
      setConversations([]);
      setWhatsappConversationList([]);
      setHasMore(false);
      setPage(0);
      setLoading({ firstLoading: false, loading: false });
      handleSetContactSelected(null);
      return;
    }

    setHasMore(true);
    fetchConversations(0);
    fetchWhatsappConversationsList(clinicInfo?.clinicId || '');
  }, [
    clinicInfo?.clinicId,
    fetchConversations,
    fetchWhatsappConversationsList,
    handleSetContactSelected,
    isWhatsAppConnected,
    whatsAppLoading,
  ]);

  useEffect(() => {
    if (loading.firstLoading || loading.loading) return;
    if (!showWhatsAppIsNotConnected) return;

    handleSetContactSelected(null);
  }, [
    handleSetContactSelected,
    loading.firstLoading,
    loading.loading,
    showWhatsAppIsNotConnected,
  ]);

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
          contactName: existingConversation.contactName || updatedConversation.contactName,
          contactPicture: existingConversation.contactPicture || updatedConversation.contactPicture,
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
          whatsappConversationList={whatsappConversationList}
          hasMore={hasMore}
          numberNotConnected={showWhatsAppIsNotConnected}
          loading={loading}
        />
      }

      {contactSelected?.id ? (
        <ChatComponent
          contactName={contactSelected.contactName}
          phoneNumber={contactSelected.phoneNumber}
          imageUrl={contactSelected.contactPicture}
          contactId={contactSelected.id}
          onAiConfigChange={handleWhatsappConversationConfigChange}
        />
      ) : (
        <div className={style.containerText}>
          <p>Crie uma conversa e começe a enviar e receber mensagens agora mesmo!</p>
        </div>
      )}
    </section>
  );
}

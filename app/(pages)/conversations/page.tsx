'use client';

import { fetchChatOverview } from '@/app/actions/fetchChatOverview';
import { useUser } from '@/app/context/userContext';
import { useWhatsApp } from '@/app/hooks/useWhatsApp';
import { ChatListItem } from '@/app/types/types';
import { useCallback, useEffect, useRef, useState } from 'react';
import ChatComponent from './components/ChatComponent/ChatComponent';
import ChatListComponent from './components/ChatListComponent/ChatListComponent';
import style from './style.module.css';

const LIMIT = 20;

export default function Conversations() {
  const { whatsAppStatus } = useWhatsApp();
  const { contactSelected, clinicInfo } = useUser();

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

        if (!response.length) {
          setHasMore(false);
          isLoadingRef.current = false;
          setLoading({ firstLoading: false, loading: false });
          return;
        }

        setConversations((prev) => {
          const merged = [...prev, ...response];
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
    [clinicInfo?.clinicId],
  );

  useEffect(() => {
    fetchConversations(0);
  }, [clinicInfo?.clinicId]);

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

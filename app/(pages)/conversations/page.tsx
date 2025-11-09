"use client";

import style from "./style.module.css";
import ChatListComponent from "./components/ChatListComponent/ChatListComponent";
import { useCallback, useEffect, useState } from "react";
import { getConversations } from "@/app/actions/getConversations";
import { useUser } from "@/app/context/userContext";
import { useWhatsApp } from "@/app/hooks/useWhatsApp";

type ChatListData = {
  ai_answer: boolean;
  from_me: boolean;
  last_message: string;
  phone_number: string;
  picture_url: string;
  sent_at: string;
  whats_app_name: string;
};

export default function Conversations() {
  const { clinicId } = useUser();
  const [chatList, setChatList] = useState<ChatListData[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState({
    firstLoading: true,
    loading: false,
  });
  const { whatsAppStatus } = useWhatsApp(clinicId);

  const fetchConversationsList = useCallback(
    async (pageNum: number) => {
      if (!clinicId || loading.loading) return;
      setLoading({ firstLoading: pageNum === 0, loading: pageNum > 0 });
      try {
        const response = await getConversations({ clinicId, page: pageNum });
        if (!response?.length) {
          setHasMore(false);
          return;
        }
        setChatList((prev) => [...prev, ...response]);
        setPage(pageNum);
      } catch (err) {
        console.error("Erro ao buscar conversas:", err);
      } finally {
        setLoading({ loading: false, firstLoading: false });
      }
    },
    [clinicId, loading]
  );

  const showWhatsAppIsNotConnected =
    whatsAppStatus?.status !== "CONNECTED" &&
    !loading.firstLoading &&
    !loading.loading;

  useEffect(() => {
    if (!clinicId) return;
    setChatList([]);
    setPage(0);
    setHasMore(true);
    fetchConversationsList(0);
  }, [clinicId]);

  const handleFetchMore = useCallback(() => {
    if (!hasMore || loading.loading) return;
    fetchConversationsList(page + 1);
  }, [hasMore, loading, page, fetchConversationsList]);

  return (
    <section className={style.conversationPageContainer}>
      <ChatListComponent
        numberNotConnected={showWhatsAppIsNotConnected}
        chatList={chatList}
        fetchMore={handleFetchMore}
        hasMore={hasMore}
        loading={loading}
      />
      <div>
        <p>conversation page</p>
      </div>
    </section>
  );
}

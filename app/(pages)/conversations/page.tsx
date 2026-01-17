"use client";

import style from "./style.module.css";
import ChatListComponent from "./components/ChatListComponent/ChatListComponent";
import { useCallback, useEffect, useState } from "react";
import { getConversations } from "@/app/actions/getConversations";
import { useUser } from "@/app/context/userContext";
import { useWhatsApp } from "@/app/hooks/useWhatsApp";
import ChatComponent from "./components/ChatComponent/ChatComponent";
import { useChat } from "@/app/context/chatContext";

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
  const { clinicId, contactSelected } = useUser();
  const { lastMessageByPhone } = useChat();
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
        const response = await getConversations({ page: pageNum });
        if (!response?.length) {
          setHasMore(false);
          return;
        }
        setChatList((prev) => {
          const merged = [...prev, ...response];
          const unique = merged.filter(
            (value, index, list) =>
              list.findIndex(
                (item) => item.phone_number === value.phone_number
              ) === index
          );
          return unique;
        });
        setPage(pageNum);
      } catch (err) {
        console.error("Error fetching chat list:", err);
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

  const handleFetchMore = useCallback(() => {
    if (!hasMore || loading.loading) return;
    fetchConversationsList(page + 1);
  }, [hasMore, loading, page, fetchConversationsList]);

  useEffect(() => {
    if (!clinicId) return;
    setChatList([]);
    setPage(0);
    setHasMore(true);
    fetchConversationsList(0);
  }, [clinicId]);

  useEffect(() => {
    const prioritizedChatList = chatList.filter((chat) => {
      return (
        chat.phone_number ===
        lastMessageByPhone[chat.phone_number]?.phone_number
      );
    });

    const otherChats = chatList.filter((chat) => {
      return (
        chat.phone_number !==
        lastMessageByPhone[chat.phone_number]?.phone_number
      );
    });

    setChatList([...prioritizedChatList, ...otherChats]);
  }, [lastMessageByPhone]);

  return (
    <section className={style.conversationPageContainer}>
      <ChatListComponent
        numberNotConnected={showWhatsAppIsNotConnected}
        chatList={chatList}
        fetchMore={handleFetchMore}
        hasMore={hasMore}
        loading={loading}
      />
      {contactSelected?.phone_number ? (
        <ChatComponent
          aiAnswerOn={contactSelected.ai_answer}
          contactName={
            contactSelected.whats_app_name
              ? contactSelected.whats_app_name
              : contactSelected.phone_number
          }
          phoneNumber={contactSelected.phone_number}
          clinicId={clinicId}
          imageUrl={contactSelected.picture_url}
        />
      ) : (
        <div className={style.containerText}>
          <p>
            Crie uma conversa e começe a enviar e receber mensagens agora mesmo!
          </p>
        </div>
      )}
    </section>
  );
}

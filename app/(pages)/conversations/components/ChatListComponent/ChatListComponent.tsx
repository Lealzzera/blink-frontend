"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ChatCardComponent from "../ChatCardComponent/ChatCardComponent";
import style from "./style.module.css";
import ButtonComponent from "@/app/components/ButtonComponent/ButtonComponent";
import { useRouter } from "next/navigation";
import formatChatDate from "@/utils/formatChatDate";
import { useUser } from "@/app/context/userContext";
import { useChat } from "@/app/context/chatContext";

type ChatListItem = {
  ai_answer: boolean;
  from_me: boolean;
  last_message: string;
  phone_number: string;
  picture_url: string;
  sent_at: string;
  whats_app_name: string;
};

type ChatListComponentProps = {
  chatList: ChatListItem[];
  fetchMore: () => void;
  hasMore: boolean;
  loading: { firstLoading: boolean; loading: boolean };
  numberNotConnected: boolean;
};

export default function ChatListComponent({
  chatList,
  fetchMore,
  hasMore,
  loading,
  numberNotConnected,
}: ChatListComponentProps) {
  const { numberSelected, handleSetNumberSelected } = useUser();
  const [cardSelected, setCardSelected] = useState<string | null>(
    numberSelected
  );
  const router = useRouter();
  const observer = useRef<IntersectionObserver | null>(null);
  const { lastMessageByPhone } = useChat();

  const lastListItem = useCallback(
    (node: HTMLLIElement | null) => {
      if (loading.firstLoading || loading.loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (entry.isIntersecting && hasMore) fetchMore();
        },
        { threshold: 0.5 }
      );
      if (node) observer.current.observe(node);
    },
    [fetchMore, hasMore, loading.firstLoading, loading.loading]
  );

  const handleCardClick = (value: string) => {
    setCardSelected(value);
    handleSetNumberSelected(value);
  };

  return (
    <div className={style.chatListContainer}>
      {numberNotConnected && !loading.firstLoading && !loading.loading && (
        <div className={style.notConnected}>
          <p>
            Você não possui um WhatsApp conectado. Conecte-se acessando a aba de
            configurações
          </p>
          <ButtonComponent
            text="Configurações"
            handleClickButton={() => router.push("/settings")}
          />
        </div>
      )}
      <ul className={style.chatListUl}>
        {loading.firstLoading
          ? Array.from({ length: 20 }).map((_, i) => (
              <li key={`skeleton-${i}`} className={style.skeletonCard}></li>
            ))
          : chatList.map((item, index) => {
              const isLast = index === chatList.length - 1;
              const lastMessage = lastMessageByPhone[item.phone_number]
                ? lastMessageByPhone[item.phone_number].message
                : item.last_message;
              return (
                <li ref={isLast ? lastListItem : null} key={item.phone_number}>
                  <ChatCardComponent
                    cardClick={() => handleCardClick(item.phone_number)}
                    contactName={item.whats_app_name}
                    imageUrl={item.picture_url}
                    cardSelected={cardSelected}
                    lastMessage={lastMessage}
                    phoneNumber={item.phone_number}
                    sentAt={formatChatDate(item.sent_at)}
                  />
                </li>
              );
            })}
      </ul>

      {loading.loading && (
        <div className={style.dots}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      )}
    </div>
  );
}

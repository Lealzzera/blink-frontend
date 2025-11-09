"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ChatCardComponent from "../ChatCardComponent/ChatCardComponent";
import style from "./style.module.css";
import ButtonComponent from "@/app/components/ButtonComponent/ButtonComponent";
import { useRouter } from "next/navigation";

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
  const [cardSelected, setCardSelected] = useState<string | undefined>();
  const observer = useRef<IntersectionObserver | null>(null);
  const router = useRouter();

  const lastListItem = useCallback(
    (node: HTMLLIElement | null) => {
      if (loading.firstLoading || loading.loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          fetchMore();
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore, fetchMore]
  );

  const handleCardClick = (value: string) => setCardSelected(value);

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
        {chatList.map((item, index) => {
          const isLast = index === chatList.length - 1;
          return (
            <li ref={isLast ? lastListItem : null} key={item.phone_number}>
              <ChatCardComponent
                cardClick={() => handleCardClick(item.phone_number)}
                contactName={item.whats_app_name}
                imageUrl={item.picture_url}
                cardSelected={cardSelected}
                lastMessage={item.last_message}
                phoneNumber={item.phone_number}
                sentAt={item.sent_at}
              />
            </li>
          );
        })}
      </ul>

      {loading.firstLoading && (
        <ul className={style.chatListUl}>
          {Array(20)
            .fill(null)
            .map((_, index) => (
              <li key={index}>
                <div className={style.skeletonCard}></div>
              </li>
            ))}
        </ul>
      )}
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

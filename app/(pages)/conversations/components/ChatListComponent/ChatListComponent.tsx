"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ChatCardComponent from "../ChatCardComponent/ChatCardComponent";
import style from "./style.module.css";
import ButtonComponent from "@/app/components/ButtonComponent/ButtonComponent";
import { useRouter } from "next/navigation";
import formatChatDate from "@/utils/formatChatDate";
import { ContactSelected, useUser } from "@/app/context/userContext";
import { useChat } from "@/app/context/chatContext";
import InputComponent from "@/app/components/InputComponent/InputComponent";

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
  const { contactSelected, handleSetContactSelected } = useUser();
  const [cardSelected, setCardSelected] = useState<ContactSelected | null>(
    contactSelected
  );
  const router = useRouter();
  const observer = useRef<IntersectionObserver | null>(null);
  const { lastMessageByPhone } = useChat();
  const [searchInputValue, setSearchInputValue] = useState("");
  const [filteredList, setFilteredList] = useState<ChatListItem[]>(chatList);
  const originalListRef = useRef<ChatListItem[]>(chatList);

  const lastListItem = useCallback(
    (node: HTMLLIElement | null) => {
      if (searchInputValue) return;
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
    [
      fetchMore,
      hasMore,
      loading.firstLoading,
      loading.loading,
      searchInputValue,
    ]
  );

  const handleCardClick = (value: ContactSelected) => {
    setCardSelected(value);
    handleSetContactSelected(value);
  };

  const handleSearchChat = (event: any) => {
    const contactName = event.target.value;
    setSearchInputValue(contactName);
  };

  useEffect(() => {
    originalListRef.current = chatList;
    setFilteredList(chatList);
  }, [chatList]);

  useEffect(() => {
    const q = String(searchInputValue || "").trim();
    if (!q) {
      setFilteredList(originalListRef.current);
      return;
    }

    const lower = q.toLowerCase();
    const newChatListFiltered = originalListRef.current.filter((chat) => {
      const name = chat.whats_app_name || "";
      const last = chat.last_message || "";
      return (
        name.toLowerCase().includes(lower) ||
        last.toLowerCase().includes(lower) ||
        chat.phone_number.includes(q)
      );
    });

    setFilteredList(newChatListFiltered);
  }, [searchInputValue]);

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
        {!loading.firstLoading && (
          <div className={style.searchInputContainer}>
            <InputComponent
              placeholder="Buscar contato"
              value={searchInputValue}
              handleChangeInput={handleSearchChat}
            />
          </div>
        )}
        {loading.firstLoading
          ? Array.from({ length: 20 }).map((_, i) => (
              <li key={`skeleton-${i}`} className={style.skeletonCard}></li>
            ))
          : filteredList.map((item, index) => {
              const isLast = index === filteredList.length - 1;
              const lastMessage = lastMessageByPhone[item.phone_number]
                ? lastMessageByPhone[item.phone_number].message
                : item.last_message;

              console.log(lastMessage);
              return (
                <li ref={isLast ? lastListItem : null} key={item.phone_number}>
                  <ChatCardComponent
                    cardClick={() => handleCardClick(item)}
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

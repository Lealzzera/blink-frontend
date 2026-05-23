'use client';

import ButtonComponent from '@/app/components/ButtonComponent/ButtonComponent';
import InputComponent from '@/app/components/InputComponent/InputComponent';
import { useChat } from '@/app/context/chatContext';
import { ContactSelected, useUser } from '@/app/context/userContext';
import { ChatListItem } from '@/app/types/types';
import formatChatDate from '@/utils/formatChatDate';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import ChatCardComponent from '../ChatCardComponent/ChatCardComponent';
import style from './style.module.css';

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
  const { clearUnreadMessages, lastMessageByPhone, unreadCountByPhone } = useChat();
  const [cardSelected, setCardSelected] = useState<ContactSelected | null>(contactSelected);
  const [searchInputValue, setSearchInputValue] = useState('');
  const [filteredList, setFilteredList] = useState<ChatListItem[]>(chatList);
  const router = useRouter();
  const observer = useRef<IntersectionObserver | null>(null);

  const originalListRef = useRef<ChatListItem[]>(chatList);

  const lastItemRef = useCallback(
    (node: HTMLLIElement) => {
      if (searchInputValue) return;
      if (loading.firstLoading || loading.loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (entry.isIntersecting && hasMore) fetchMore();
        },
        {
          threshold: 0.5,
        },
      );
      if (node) observer.current.observe(node);
    },
    [fetchMore, hasMore, loading.firstLoading, loading.loading, searchInputValue],
  );

  const handleCardClick = (value: ContactSelected) => {
    setCardSelected(value);
    handleSetContactSelected(value);
    clearUnreadMessages(value.phoneNumber);
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
    const q = String(searchInputValue || '').trim();
    if (!q) {
      setFilteredList(originalListRef.current);
      return;
    }

    const lower = q.toLowerCase();
    const newChatListFiltered = originalListRef.current.filter((chat) => {
      const name = chat.contactName || '';
      const last = chat.lastMessage.message || '';
      return (
        name.toLowerCase().includes(lower) ||
        last.toLowerCase().includes(lower) ||
        chat.phoneNumber.includes(q)
      );
    });

    setFilteredList(newChatListFiltered);
  }, [searchInputValue]);

  return (
    <div className={style.chatListContainer}>
      {numberNotConnected && !loading.firstLoading && !loading.loading && (
        <div className={style.notConnected}>
          <p>Você não possui um WhatsApp conectado. Conecte-se acessando a aba de configurações</p>
          <ButtonComponent
            text="Configurações"
            handleClickButton={() => router.push('/settings')}
          />
        </div>
      )}
      <ul className={style.chatListUl}>
        {!loading.firstLoading && !numberNotConnected && (
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
              const isLast = !searchInputValue && index === chatList.length - 1;
              const lastMessage = lastMessageByPhone[item.phoneNumber]
                ? lastMessageByPhone[item.phoneNumber].message
                : item.lastMessage.message;
              const sentAt = lastMessageByPhone[item.phoneNumber]
                ? Math.floor(
                    new Date(lastMessageByPhone[item.phoneNumber].sent_at).getTime() / 1000,
                  )
                : Number(item.lastMessage.sentAt);

              return (
                <li ref={isLast ? lastItemRef : null} key={item.phoneNumber}>
                  <ChatCardComponent
                    cardClick={() => handleCardClick(item)}
                    contactName={item.contactName}
                    imageUrl={item.contactPicture}
                    cardSelected={cardSelected}
                    lastMessage={lastMessage}
                    phoneNumber={item.phoneNumber}
                    sentAt={formatChatDate(sentAt)}
                    unreadCount={unreadCountByPhone[item.phoneNumber] ?? 0}
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

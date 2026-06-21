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
  whatsappConversationList?: any[];
};

type ConversationFilter = 'all' | 'human' | 'ai';
const MIN_SEARCH_LENGTH = 3;

function normalizePhoneNumber(value?: string | null) {
  return String(value ?? '').replace(/\D/g, '');
}

function normalizeChatId(value?: string | null) {
  return String(value ?? '').trim();
}

export default function ChatListComponent({
  chatList,
  fetchMore,
  hasMore,
  loading,
  numberNotConnected,
  whatsappConversationList,
}: ChatListComponentProps) {
  const { contactSelected, handleSetContactSelected } = useUser();
  const { clearUnreadMessages, lastMessageByPhone, unreadCountByPhone } = useChat();
  const [cardSelected, setCardSelected] = useState<ContactSelected | null>(contactSelected);
  const [searchInputValue, setSearchInputValue] = useState('');
  const [filteredList, setFilteredList] = useState<ChatListItem[]>(chatList);
  const [selectedFilter, setSelectedFilter] = useState<ConversationFilter>('all');
  const router = useRouter();
  const observer = useRef<IntersectionObserver | null>(null);

  const originalListRef = useRef<ChatListItem[]>(chatList);

  const getConversationAiEnabled = useCallback(
    (chat: ChatListItem) => {
      const chatId = normalizeChatId(chat.id);
      const phoneNumber = normalizePhoneNumber(chat.phoneNumber);

      const conversation = whatsappConversationList?.find((item) => {
        const itemChatId = normalizeChatId(item.chatId);
        const itemPhoneNumber = normalizePhoneNumber(item.phoneNumber);

        return itemChatId === chatId || (!!phoneNumber && itemPhoneNumber === phoneNumber);
      });

      return conversation?.aiEnabled ?? true;
    },
    [whatsappConversationList],
  );

  const applyFilters = useCallback(
    (nextSearchValue: string, nextSelectedFilter: ConversationFilter) => {
      const searchValue = nextSearchValue.trim().toLowerCase();
      const shouldSearch = searchValue.length >= MIN_SEARCH_LENGTH;
      const normalizedSearchValue = normalizePhoneNumber(nextSearchValue);
      const shouldSearchPhoneNumber = normalizedSearchValue.length >= MIN_SEARCH_LENGTH;

      const nextFilteredList = originalListRef.current.filter((chat) => {
        const matchesSelectedFilter =
          nextSelectedFilter === 'all' ||
          (nextSelectedFilter === 'human' && getConversationAiEnabled(chat) === false) ||
          (nextSelectedFilter === 'ai' && getConversationAiEnabled(chat) !== false);

        if (!matchesSelectedFilter) return false;
        if (!shouldSearch) return true;

        const name = chat.contactName || '';
        const last = chat.lastMessage.message || '';
        const phoneNumber = chat.phoneNumber || '';

        return (
          name.toLowerCase().includes(searchValue) ||
          last.toLowerCase().includes(searchValue) ||
          (shouldSearchPhoneNumber && normalizePhoneNumber(phoneNumber).includes(normalizedSearchValue))
        );
      });

      setFilteredList(nextFilteredList);
    },
    [getConversationAiEnabled],
  );

  const handleFilterChat = (filter: ConversationFilter) => {
    const nextFilter = selectedFilter === filter ? 'all' : filter;
    setSelectedFilter(nextFilter);
    applyFilters(searchInputValue, nextFilter);
  };

  const hiddenHumanUnreadCount =
    selectedFilter === 'ai'
      ? originalListRef.current.reduce((totalUnreadMessages, chat) => {
          if (getConversationAiEnabled(chat) !== false) return totalUnreadMessages;

          return totalUnreadMessages + (unreadCountByPhone[chat.phoneNumber] ?? 0);
        }, 0)
      : 0;

  const lastItemRef = useCallback(
    (node: HTMLLIElement) => {
      if (searchInputValue) return;
      if (selectedFilter !== 'all') return;
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
    [fetchMore, hasMore, loading.firstLoading, loading.loading, searchInputValue, selectedFilter],
  );

  const handleCardClick = (value: ContactSelected) => {
    setCardSelected(value);
    handleSetContactSelected(value);
    clearUnreadMessages(value.phoneNumber);
  };

  const handleSearchChat = (event: React.ChangeEvent<HTMLInputElement>) => {
    const contactName = event.target.value;
    setSearchInputValue(contactName);
    applyFilters(contactName, selectedFilter);
  };

  useEffect(() => {
    originalListRef.current = chatList;
    applyFilters(searchInputValue, selectedFilter);
  }, [chatList, whatsappConversationList, applyFilters, searchInputValue, selectedFilter]);

  useEffect(() => {
    setCardSelected(contactSelected);
  }, [contactSelected]);

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
          <>
            <div className={style.searchInputContainer}>
              <InputComponent
                placeholder="Buscar contato"
                value={searchInputValue}
                handleChangeInput={handleSearchChat}
              />
            </div>
            <div className={style.filterButtonsSection}>
              <button
                type="button"
                className={selectedFilter === 'human' ? style.activeFilterButton : undefined}
                onClick={() => handleFilterChat('human')}
              >
                Atendimento Humano
                {hiddenHumanUnreadCount > 0 && (
                  <span className={style.filterUnreadBadge}>
                    {hiddenHumanUnreadCount > 10 ? '10+' : hiddenHumanUnreadCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                className={selectedFilter === 'ai' ? style.activeFilterButton : undefined}
                onClick={() => handleFilterChat('ai')}
              >
                Secretária Virtual (IA)
              </button>
            </div>
          </>
        )}
        {loading.firstLoading
          ? Array.from({ length: 20 }).map((_, i) => (
              <li key={`skeleton-${i}`} className={style.skeletonCard}></li>
            ))
          : filteredList.map((item, index) => {
              const isLast =
                !searchInputValue && selectedFilter === 'all' && index === filteredList.length - 1;
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
            {
              filteredList.length === 0 && !numberNotConnected && (
                <li style={{ textAlign: 'center', padding: '20px' }}>
                  <p>Nenhum chat encontrado</p>
                </li>
              )
            }
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

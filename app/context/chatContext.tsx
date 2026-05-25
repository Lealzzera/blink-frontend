'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { getRealtimeWebSocketUrl } from '../actions/getRealtimeWebSocketUrl';
import { useUser } from './userContext';

export type ChatMessage = {
  chat_id?: string;
  phone_number: string;
  clinic_id: string;
  message: string;
  from_me: boolean;
  sent_at: string;
  contact_name?: string | null;
  contact_picture?: string | null;
  has_media?: boolean;
  id?: string;
};

export type WahaRealtimeMessage = {
  event: string;
  payload: unknown;
};

type WahaMessageAnyPayload = {
  eventId?: string;
  phoneChatId?: string | null;
  sourceChatId?: string;
  contactName?: string | null;
  contactPicture?: string | null;
  fromMe?: boolean;
  hasMedia?: boolean;
  message?: string;
  timestamp?: number;
};

type WahaMessageAckPayload = {
  ack?: number;
  eventId?: string;
  fromMe?: boolean;
  phoneChatId?: string | null;
};

type ChatContextType = {
  messagesByPhone: Record<string, ChatMessage[]>;
  lastMessageByPhone: Record<string, ChatMessage>;
  latestChatMessage: ChatMessage | null;
  lastWahaEvent: WahaRealtimeMessage | null;
  unreadCountByPhone: Record<string, number>;
  wahaEvents: WahaRealtimeMessage[];
  clearUnreadMessages: (phoneNumber: string) => void;
  hydrateUnreadCounts: (countsByPhone: Record<string, number>) => void;
  pushIncomingMessage: (msg: ChatMessage) => void;
  pushLocalMessage: (msg: ChatMessage) => void;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

function formatChatIdToPhoneNumber(chatId: string) {
  return chatId.replace(/^(\d{2})(\d{2})(\d{4,5}?)(\d{4})@c\.us$/, '+$1 $2 $3-$4');
}

function isWahaMessageAnyPayload(payload: unknown): payload is WahaMessageAnyPayload {
  if (!payload || typeof payload !== 'object') return false;

  const value = payload as WahaMessageAnyPayload;

  return typeof value.phoneChatId === 'string' && typeof value.message === 'string';
}

function isWahaMessageAckPayload(payload: unknown): payload is WahaMessageAckPayload {
  if (!payload || typeof payload !== 'object') return false;

  const value = payload as WahaMessageAckPayload;

  return typeof value.phoneChatId === 'string' && typeof value.ack === 'number';
}

function mapWahaMessageAnyToChatMessage(
  payload: WahaMessageAnyPayload,
  clinicId: string,
): ChatMessage | null {
  if (!payload.phoneChatId || !payload.message) return null;

  return {
    id: payload.eventId,
    chat_id: payload.phoneChatId,
    phone_number: formatChatIdToPhoneNumber(payload.phoneChatId),
    clinic_id: clinicId,
    message: payload.message,
    from_me: Boolean(payload.fromMe),
    sent_at: payload.timestamp ? new Date(payload.timestamp * 1000).toISOString() : new Date().toISOString(),
    contact_name: payload.contactName,
    contact_picture: payload.contactPicture,
    has_media: Boolean(payload.hasMedia),
  };
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messagesByPhone, setMessagesByPhone] = useState<Record<string, ChatMessage[]>>({});
  const [lastMessageByPhone, setLastMessageByPhone] = useState<Record<string, ChatMessage>>({});
  const [latestChatMessage, setLatestChatMessage] = useState<ChatMessage | null>(null);
  const [lastWahaEvent, setLastWahaEvent] = useState<WahaRealtimeMessage | null>(null);
  const [unreadMessageIdsByPhone, setUnreadMessageIdsByPhone] = useState<Record<string, string[]>>({});
  const [wahaEvents, setWahaEvents] = useState<WahaRealtimeMessage[]>([]);
  const { clinicInfo, contactSelected } = useUser();
  const socketRef = useRef<WebSocket | null>(null);
  const selectedPhoneNumberRef = useRef<string | null>(null);

  const unreadCountByPhone = Object.fromEntries(
    Object.entries(unreadMessageIdsByPhone).map(([phoneNumber, unreadMessageIds]) => [
      phoneNumber,
      unreadMessageIds.length,
    ]),
  );

  const addUnreadMessage = (phoneNumber: string, messageId: string) => {
    setUnreadMessageIdsByPhone((prev) => {
      const unreadMessageIds = prev[phoneNumber] ?? [];

      if (unreadMessageIds.includes(messageId)) {
        return prev;
      }

      return {
        ...prev,
        [phoneNumber]: [...unreadMessageIds, messageId],
      };
    });
  };

  const hydrateUnreadCounts = useCallback((countsByPhone: Record<string, number>) => {
    setUnreadMessageIdsByPhone((prev) => {
      const next = { ...prev };
      let hasChanges = false;

      Object.entries(countsByPhone).forEach(([phoneNumber, count]) => {
        if (selectedPhoneNumberRef.current === phoneNumber) return;

        const unreadCount = Math.max(0, Number(count) || 0);
        const currentUnreadMessageIds = next[phoneNumber] ?? [];

        if (unreadCount === 0) {
          if (currentUnreadMessageIds.length) {
            delete next[phoneNumber];
            hasChanges = true;
          }
          return;
        }

        if (currentUnreadMessageIds.length >= unreadCount) return;

        const missingCount = unreadCount - currentUnreadMessageIds.length;
        const hydratedUnreadMessageIds: string[] = [];

        for (let index = 0; index < missingCount; index += 1) {
          hydratedUnreadMessageIds.push(
            `overview:${phoneNumber}:${currentUnreadMessageIds.length + index}`,
          );
        }

        next[phoneNumber] = [...currentUnreadMessageIds, ...hydratedUnreadMessageIds];
        hasChanges = true;
      });

      return hasChanges ? next : prev;
    });
  }, []);

  const clearUnreadMessages = (phoneNumber: string) => {
    setUnreadMessageIdsByPhone((prev) => {
      if (!prev[phoneNumber]?.length) return prev;

      const next = { ...prev };
      delete next[phoneNumber];

      return next;
    });
  };

  useEffect(() => {
    selectedPhoneNumberRef.current = contactSelected?.phoneNumber ?? null;

    if (contactSelected?.phoneNumber) {
      clearUnreadMessages(contactSelected.phoneNumber);
    }
  }, [contactSelected?.phoneNumber]);

  const pushIncomingMessage = (message: ChatMessage) => {
    if (!message) return;

    setMessagesByPhone((prev) => {
      const list = prev[message.phone_number] || [];

      const exists = list.some(
        (m) => m.sent_at === message.sent_at && m.message === message.message,
      );
      if (exists) return prev;

      return {
        ...prev,
        [message.phone_number]: [...list, message],
      };
    });

    setLastMessageByPhone((prev) => ({
      ...prev,
      [message.phone_number]: message,
    }));
    setLatestChatMessage(message);
  };

  const pushLocalMessage = (msg: ChatMessage) => {
    pushIncomingMessage(msg);
  };

  useEffect(() => {
    if (!clinicInfo) return;
    let mounted = true;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    const connect = async () => {
      const wsUrl = await getRealtimeWebSocketUrl(clinicInfo.clinicId);

      if (!wsUrl || !mounted) return;

      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log('Realtime websocket connected');
      };

      socket.onmessage = (event) => {
        let message: WahaRealtimeMessage;

        try {
          message = JSON.parse(event.data) as WahaRealtimeMessage;
        } catch {
          console.warn('Realtime websocket received a non-json message:', event.data);
          return;
        }

        console.log('Realtime websocket message:', message);

        if (message.event === 'waha:event') {
          setLastWahaEvent(message);
          setWahaEvents((prev) => [...prev.slice(-49), message]);
          return;
        }

        if (message.event === 'message_any' && clinicInfo?.clinicId) {
          setLastWahaEvent(message);
          setWahaEvents((prev) => [...prev.slice(-49), message]);

          if (!isWahaMessageAnyPayload(message.payload)) return;

          const chatMessage = mapWahaMessageAnyToChatMessage(message.payload, clinicInfo.clinicId);

          if (chatMessage) {
            pushIncomingMessage(chatMessage);

            if (!chatMessage.from_me && selectedPhoneNumberRef.current !== chatMessage.phone_number) {
              addUnreadMessage(chatMessage.phone_number, chatMessage.id ?? chatMessage.sent_at);
            }
          }

          return;
        }

        if (message.event === 'message_ack') {
          setLastWahaEvent(message);
          setWahaEvents((prev) => [...prev.slice(-49), message]);

          if (!isWahaMessageAckPayload(message.payload)) return;
          if (!message.payload.phoneChatId) return;

          const phoneNumber = formatChatIdToPhoneNumber(message.payload.phoneChatId);
          const messageId = message.payload.eventId ?? `${phoneNumber}:${message.payload.ack}`;

          if (
            message.payload.ack === 2 &&
            !message.payload.fromMe &&
            selectedPhoneNumberRef.current !== phoneNumber
          ) {
            addUnreadMessage(phoneNumber, messageId);
          }

          if (message.payload.ack === 3) {
            clearUnreadMessages(phoneNumber);
          }
        }
      };

      socket.onerror = (event) => {
        console.error('Realtime websocket error:', event);
      };

      socket.onclose = () => {
        socketRef.current = null;

        if (!mounted) return;

        reconnectTimeout = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      mounted = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [clinicInfo?.clinicId]);

  return (
    <ChatContext.Provider
      value={{
        messagesByPhone,
        lastMessageByPhone,
        latestChatMessage,
        lastWahaEvent,
        unreadCountByPhone,
        wahaEvents,
        clearUnreadMessages,
        hydrateUnreadCounts,
        pushIncomingMessage,
        pushLocalMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within a ChatProvider');
  return ctx;
}

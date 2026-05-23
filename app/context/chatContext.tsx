'use client';

import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { getRealtimeWebSocketUrl } from '../actions/getRealtimeWebSocketUrl';
import { useUser } from './userContext';

export type ChatMessage = {
  phone_number: string;
  clinic_id: number;
  message: string;
  from_me: boolean;
  sent_at: string;
};

export type WahaRealtimeMessage = {
  event: string;
  payload: unknown;
};

type ChatContextType = {
  messagesByPhone: Record<string, ChatMessage[]>;
  lastMessageByPhone: Record<string, ChatMessage>;
  lastWahaEvent: WahaRealtimeMessage | null;
  wahaEvents: WahaRealtimeMessage[];
  pushIncomingMessage: (msg: ChatMessage) => void;
  pushLocalMessage: (msg: ChatMessage) => void;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messagesByPhone, setMessagesByPhone] = useState<Record<string, ChatMessage[]>>({});
  const [lastMessageByPhone, setLastMessageByPhone] = useState<Record<string, ChatMessage>>({});
  const [lastWahaEvent, setLastWahaEvent] = useState<WahaRealtimeMessage | null>(null);
  const [wahaEvents, setWahaEvents] = useState<WahaRealtimeMessage[]>([]);
  const { clinicInfo } = useUser();
  const socketRef = useRef<WebSocket | null>(null);

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
        lastWahaEvent,
        wahaEvents,
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

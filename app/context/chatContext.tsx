"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import SockJS from "sockjs-client";
import { Client, Message } from "@stomp/stompjs";
import { createClient } from "@/utils/supabase/client";

export type ChatMessage = {
  phone_number: string;
  clinic_id: number;
  message: string;
  from_me: boolean;
  sent_at: string;
};

type ChatContextType = {
  messagesByPhone: Record<string, ChatMessage[]>;
  lastMessageByPhone: Record<string, ChatMessage>;
  pushIncomingMessage: (msg: ChatMessage) => void;
  pushLocalMessage: (msg: ChatMessage) => void;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messagesByPhone, setMessagesByPhone] = useState<
    Record<string, ChatMessage[]>
  >({});

  const [lastMessageByPhone, setLastMessageByPhone] = useState<
    Record<string, ChatMessage>
  >({});

  const clientRef = useRef<Client | null>(null);

  const pushIncomingMessage = (message: ChatMessage) => {
    if (!message) return;

    setMessagesByPhone((prev) => {
      const list = prev[message.phone_number] || [];

      const exists = list.some(
        (m) => m.sent_at === message.sent_at && m.message === message.message
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
    let mounted = true;

    const init = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const token = session?.access_token;
      const userId = session?.user?.id;

      if (!token || !userId || !mounted) return;

      const socket = new SockJS(
        `${process.env.NEXT_PUBLIC_BLINK_BE_WS}/wpp-socket/subscribe?token=Bearer%20${token}`
      );

      const client = new Client({
        webSocketFactory: () => socket,
        connectHeaders: { Authorization: `Bearer ${token}` },
        onConnect: () => {
          const topic = `/user/${userId}/notify/message-received`;

          client.subscribe(topic, (msg: Message) => {
            const payload = JSON.parse(msg.body);
            pushIncomingMessage(payload);
          });
        },
        onStompError: (frame) => {
          console.error("❌ Erro STOMP:", frame?.body ?? frame);
        },
      });

      clientRef.current = client;
      client.activate();
    };

    init();

    return () => {
      mounted = false;
      clientRef.current?.deactivate();
      clientRef.current = null;
    };
  }, []);

  return (
    <ChatContext.Provider
      value={{
        messagesByPhone,
        lastMessageByPhone,
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
  if (!ctx) throw new Error("useChat must be used within a ChatProvider");
  return ctx;
}

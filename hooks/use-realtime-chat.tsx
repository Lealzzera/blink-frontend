// use-realtime-chat.tsx

"use client";

import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Client, IMessage } from "@stomp/stompjs";

interface UseRealtimeChatProps {
  roomName: string;   // normalmente o número do contato (ex: 5599999999999)
  username: string;   // nome do agente/logado
  token?: string;     // token para Authorization
  clinicId?: number;  // clinica para filtrar mensagens recebidas
}

export interface ChatMessage {
  text: ReactNode;
  id: string;
  content: string;
  user: {
    name: string;
  };
  createdAt: string;
}

const sanitize = (v?: string) => (v || "").toString().replace(/\D/g, "");

export function useRealtimeChat({ roomName, username, token, clinicId = 1 }: UseRealtimeChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const clientRef = useRef<Client | null>(null);
  const subsRef = useRef<Array<() => void>>([]);

  // Constrói URL WebSocket
  const buildWsUrl = () => {
    const base = ("https://be.blinkdentalmarketing.com.br/api/v1").replace(/\/+$/, "");
    const isHttps = base.startsWith("https://");
    const protocol = isHttps ? "wss://" : "ws://";
    const withoutProtocol = base.replace(/^https?:\/\//, "");
    // endpoint websocket STOMP
    return `${protocol}${withoutProtocol}/wpp-socket`;
  };

  useEffect(() => {
    if (!roomName || !token) return;

    const wsUrl = buildWsUrl();

    const client = new Client({
      brokerURL: wsUrl, // WebSocket nativo (sem SockJS)
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      onConnect: () => {
        setIsConnected(true);

        const onMessage = (frame: IMessage) => {
          try {
            const payload = JSON.parse(frame.body) as {
              sender: string;
              message: string;
              clinic_id?: number;
              createdAt?: string;
            };

            if (sanitize(payload.sender) !== sanitize(roomName)) return;
            if (payload.clinic_id != null && Number(payload.clinic_id) !== Number(clinicId)) return;

            const msg: ChatMessage = {
              id: crypto.randomUUID(),
              text: payload.message,
              content: payload.message,
              user: { name: payload.sender || "Contato" },
              createdAt: payload.createdAt || new Date().toISOString(),
            };

            setMessages((current) => {
              if (current.some((m) => m.id === msg.id)) return current;
              return [...current, msg];
            });
          } catch {
            const raw = frame.body || "";
            if (!raw) return;
            const msg: ChatMessage = {
              id: crypto.randomUUID(),
              text: raw,
              content: raw,
              user: { name: "Contato" },
              createdAt: new Date().toISOString(),
            };
            setMessages((current) => [...current, msg]);
          }
        };

        const sub1 = client.subscribe("/wpp-socket/notify/message-received", onMessage);
        const sub2 = client.subscribe("/wpp-socket/subscribe", onMessage);

        subsRef.current = [
          () => sub1.unsubscribe(),
          () => sub2.unsubscribe(),
        ];
      },
      onStompError: () => {
        setIsConnected(false);
      },
      onWebSocketClose: () => {
        setIsConnected(false);
      },
    });

    clientRef.current = client;
    client.activate();

    return () => {
      subsRef.current.forEach((fn) => {
        try { fn(); } catch {}
      });
      subsRef.current = [];
      try {
        client.deactivate();
      } catch {}
      clientRef.current = null;
      setMessages([]);
      setIsConnected(false);
    };
  }, [roomName, token, clinicId]);

  const sendMessage = useCallback(
    (content: string) => {
      const message: ChatMessage = {
        id: crypto.randomUUID(),
        text: content,
        content: content,
        user: { name: username },
        createdAt: new Date().toISOString(),
      };

      setMessages((current) => [...current, message]);

      // Se quiser publicar via STOMP também:
      // try {
      //   clientRef.current?.publish({
      //     destination: "/wpp-socket/subscribe",
      //     body: JSON.stringify({
      //       sender: sanitize(roomName),
      //       message: content,
      //       clinic_id: clinicId,
      //     }),
      //     headers: { Authorization: `Bearer ${token}` },
      //   });
      // } catch {}
    },
    [username, roomName, clinicId, token]
  );

  return {
    messages,
    sendMessage,
    isConnected,
  };
}

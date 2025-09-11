// use-realtime-chat.tsx

"use client";

import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Client, IMessage } from "@stomp/stompjs";

interface UseRealtimeChatProps {
  roomName: string;
  username: string;
  token?: string;
  clinicId?: number;
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



export function useRealtimeChat({
  roomName,
  username,
  token,
  clinicId = 1,
}: UseRealtimeChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const clientRef = useRef<Client | null>(null);
  const unsubRef = useRef<() => void>(() => {});

  // Constrói URL WebSocket
  const buildWsUrl = () => {
    const base = "https://be.blinkdentalmarketing.com.br/api/v1".replace(
      /\/+$/,
      ""
    );
    const isHttps = base.startsWith("https://");
    const protocol = isHttps ? "wss://" : "ws://";
    const withoutProtocol = base.replace(/^https?:\/\//, "");
    return `${protocol}${withoutProtocol}/wpp-socket`;
  };

  useEffect(() => {
    if (!roomName || !token) return;

    const wsUrl = buildWsUrl();

    const client = new Client({
      brokerURL: wsUrl,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      onConnect: () => {
        setIsConnected(true);

        // callback para mensagens recebidas
        const onMessage = (frame: IMessage) => {
          try {
            const payload = JSON.parse(frame.body) as {
              sender: string;
              message: string;
              clinic_id?: number;
              createdAt?: string;
            };

            // filtra por contato e clínica
            if (sanitize(payload.sender) !== sanitize(roomName)) return;
            if (
              payload.clinic_id != null &&
              Number(payload.clinic_id) !== Number(clinicId)
            )
              return;

            const msg: ChatMessage = {
              id: crypto.randomUUID(),
              text: payload.message,
              content: payload.message,
              user: { name: payload.sender || "Contato" },
              createdAt: payload.createdAt || new Date().toISOString(),
            };

            setMessages((current) => [...current, msg]);
          } catch (err) {
            console.error("Erro ao parsear mensagem STOMP:", err, frame.body);
          }
        };

        // ✅ Assina somente o tópico que realmente envia mensagens
        const subscription = client.subscribe(
          "/wpp-socket/notify/message-received",
          onMessage
        );

        unsubRef.current = () => {
          try {
            subscription.unsubscribe();
          } catch {}
        };
      },
      onStompError: () => setIsConnected(false),
      onWebSocketClose: () => setIsConnected(false),
    });

    clientRef.current = client;
    client.activate();

    return () => {
      try {
        unsubRef.current();
      } catch {}
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

      // ✅ Publicar no tópico correto
      try {
        clientRef.current?.publish({
          destination: "/wpp-socket/subscribe",
          body: JSON.stringify({
            sender: sanitize(roomName),
            message: content,
            clinic_id: clinicId,
          }),
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error("Erro ao enviar mensagem STOMP:", err);
      }
    },
    [username, roomName, clinicId, token]
  );

  return {
    messages,
    sendMessage,
    isConnected,
  };
}

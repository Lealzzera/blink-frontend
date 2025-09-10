"use client";

import { createClient } from "@/lib/client";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";

interface UseRealtimeChatProps {
  roomName: string;
  username: string;
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
  fromMe?: boolean;
}

const SUPABASE_EVENT_MESSAGE_TYPE = "message";
const BACKEND_WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || "wss://be.blinkdentalmarketing.com.br";

export function useRealtimeChat({
  roomName,
  username,
  clinicId = 1,
}: UseRealtimeChatProps) {
  const supabase = createClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // refs para evitar recriação
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const supabaseChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(
    null
  );

  // Conexão com Supabase
  useEffect(() => {
    if (!roomName) return;

    const newChannel = supabase.channel(roomName);

    newChannel
      .on("broadcast", { event: SUPABASE_EVENT_MESSAGE_TYPE }, (payload) => {
        const msg = payload.payload as ChatMessage;
        setMessages((current) =>
          current.some((m) => m.id === msg.id) ? current : [...current, msg]
        );
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("Conectado ao Supabase channel");
        }
      });

    supabaseChannelRef.current = newChannel;

    return () => {
      supabase.removeChannel(newChannel);
      supabaseChannelRef.current = null;
    };
  }, [roomName, supabase]);

  // Conexão com WebSocket do backend
  useEffect(() => {
    if (!roomName) return;

    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(`${BACKEND_WS_URL}/wpp-socket/subscribe`);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("Conectado ao WebSocket do WhatsApp");
          setIsConnected(true);

          // Envia subscribe
          const subscribeMessage = JSON.stringify({
            type: "subscribe",
            clinic_id: clinicId,
          });
          ws.send(subscribeMessage);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === "message-received") {
              const message: ChatMessage = {
                id: `ws-${Date.now()}-${Math.random()}`,
                text: data.message,
                content: data.message,
                user: { name: data.sender },
                createdAt: new Date().toISOString(),
                fromMe: false,
              };

              setMessages((current) =>
                current.some((m) => m.id === message.id)
                  ? current
                  : [...current, message]
              );

              // Replicar para Supabase
              if (supabaseChannelRef.current) {
                supabaseChannelRef.current.send({
                  type: "broadcast",
                  event: SUPABASE_EVENT_MESSAGE_TYPE,
                  payload: message,
                });
              }
            }
          } catch (error) {
            console.error("Erro ao processar mensagem WebSocket:", error);
          }
        };

        ws.onclose = () => {
          console.log("Conexão WebSocket fechada");
          setIsConnected(false);

          // tenta reconectar
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = (error) => {
          console.error("Erro WebSocket:", error);
          setIsConnected(false);
        };
      } catch (error) {
        console.error("Erro ao conectar WebSocket:", error);
        setIsConnected(false);
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [roomName, clinicId]);

  // Função para enviar mensagem
  const sendMessage = useCallback(
    async (content: string) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.error("WebSocket não conectado");
        return false;
      }

      try {
        const localMessage: ChatMessage = {
          id: `local-${Date.now()}-${Math.random()}`,
          text: content,
          content,
          user: { name: username },
          createdAt: new Date().toISOString(),
          fromMe: true,
        };

        setMessages((current) => [...current, localMessage]);

        // Supabase
        if (supabaseChannelRef.current) {
          await supabaseChannelRef.current.send({
            type: "broadcast",
            event: SUPABASE_EVENT_MESSAGE_TYPE,
            payload: localMessage,
          });
        }

        // Backend
        const wsMessage = JSON.stringify({
          type: "send-message",
          sender: username,
          message: content,
          clinic_id: clinicId,
          phone_number: roomName,
        });

        ws.send(wsMessage);

        return true;
      } catch (error) {
        console.error("Erro ao enviar mensagem:", error);
        return false;
      }
    },
    [username, clinicId, roomName]
  );

  return {
    messages,
    sendMessage,
    isConnected,
  };
}

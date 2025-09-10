"use client";

import { createClient } from "@/lib/client";
import { ReactNode, useCallback, useEffect, useState, useRef } from "react";

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
const BACKEND_WS_URL = process.env.NEXT_PUBLIC_WS_URL || "wss://be.blinkdentalmarketing.com.br";

export function useRealtimeChat({ roomName, username, clinicId = 1 }: UseRealtimeChatProps) {
  const supabase = createClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [supabaseChannel, setSupabaseChannel] = useState<ReturnType<typeof supabase.channel> | null>(null);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  // Conexão com Supabase (para mensagens em tempo real entre usuários)
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

    setSupabaseChannel(newChannel);

    return () => {
      supabase.removeChannel(newChannel);
    };
  }, [roomName, supabase]);

  // Conexão com WebSocket do backend (WhatsApp)
  useEffect(() => {
    if (!roomName) return;

    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(`${BACKEND_WS_URL}/wpp-socket/subscribe`);
        
        ws.onopen = () => {
          console.log("Conectado ao WebSocket do WhatsApp");
          setIsConnected(true);
          
          // Enviar mensagem de subscribe com clinic_id
          const subscribeMessage = JSON.stringify({
            type: "subscribe",
            clinic_id: clinicId
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
                fromMe: false // Mensagens recebidas não são do usuário atual
              };
              
              setMessages((current) =>
                current.some((m) => m.id === message.id) ? current : [...current, message]
              );

              // Replicar para o Supabase channel se necessário
              if (supabaseChannel) {
                supabaseChannel.send({
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
          
          // Tentar reconectar após 3 segundos
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, 3000);
        };

        ws.onerror = (error) => {
          console.error("Erro WebSocket:", error);
          setIsConnected(false);
        };

        setWsConnection(ws);

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
      if (wsConnection) {
        wsConnection.close();
      }
    };
  }, [roomName, clinicId, supabaseChannel]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!wsConnection || !isConnected) {
        console.error("WebSocket não conectado");
        return false;
      }

      try {
        // Criar mensagem local imediatamente para feedback rápido
        const localMessage: ChatMessage = {
          id: `local-${Date.now()}-${Math.random()}`,
          text: content,
          content,
          user: { name: username },
          createdAt: new Date().toISOString(),
          fromMe: true
        };

        setMessages((current) => [...current, localMessage]);

        // Enviar para o Supabase channel
        if (supabaseChannel) {
          await supabaseChannel.send({
            type: "broadcast",
            event: SUPABASE_EVENT_MESSAGE_TYPE,
            payload: localMessage,
          });
        }

        // Enviar para o WebSocket do backend (WhatsApp)
        const wsMessage = JSON.stringify({
          type: "send-message",
          sender: username,
          message: content,
          clinic_id: clinicId,
          phone_number: roomName // roomName é o número do telefone
        });

        wsConnection.send(wsMessage);

        return true;

      } catch (error) {
        console.error("Erro ao enviar mensagem:", error);
        return false;
      }
    },
    [wsConnection, isConnected, username, clinicId, roomName, supabaseChannel]
  );

  return {
    messages,
    sendMessage,
    isConnected,
  };
}
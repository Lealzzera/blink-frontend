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
  clinicId = 1, // Default value, consistent with component
}: UseRealtimeChatProps) {
  const supabase = createClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // Novo estado para o status da conexão WebSocket
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  
  // Refs para evitar recriação e gerenciar reconexão
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0); // Para o exponential backoff
  const supabaseChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(
    null
  );

  const MAX_RECONNECT_ATTEMPTS = 20; // Limite de tentativas de reconexão

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
          console.log("Conectado ao Supabase channel:", roomName);
        }
      });

    supabaseChannelRef.current = newChannel;

    return () => {
      supabase.removeChannel(newChannel);
      supabaseChannelRef.current = null;
    };
  }, [roomName, supabase]);

  // Conexão com WebSocket do backend
  const connectWebSocket = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log("WebSocket já está aberto. Ignorando nova conexão.");
      return;
    }
    if (!roomName) {
      setConnectionStatus('error');
      console.error("Não é possível conectar ao WebSocket: roomName não definido.");
      return;
    }

    setConnectionStatus('connecting'); // Indica que está tentando conectar
    
    // Limpa timeout anterior se houver
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    try {
      const ws = new WebSocket(`${BACKEND_WS_URL}/wpp-socket/subscribe`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("Conectado ao WebSocket do WhatsApp");
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0; // Reseta tentativas no sucesso

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
            // Verifica se a mensagem é para a roomName atual
            // Assumimos que data.sender é o número de telefone
            if (data.sender === roomName) {
                const message: ChatMessage = {
                    id: `ws-${data.message_id || Date.now()}-${Math.random()}`, // Use message_id se disponível
                    text: data.message,
                    content: data.message,
                    user: { name: data.sender }, // Remetente do WhatsApp
                    createdAt: new Date().toISOString(),
                    fromMe: false,
                };

                setMessages((current) =>
                    current.some((m) => m.id === message.id) ? current : [...current, message]
                );

                // Replicar para Supabase para garantir sincronia em outras abas/clientes
                if (supabaseChannelRef.current) {
                    supabaseChannelRef.current.send({
                        type: "broadcast",
                        event: SUPABASE_EVENT_MESSAGE_TYPE,
                        payload: message,
                    });
                }
            } else {
                console.log("Mensagem recebida para outro contato, ignorada:", data.sender);
            }
          }
        } catch (error) {
          console.error("Erro ao processar mensagem WebSocket:", error);
        }
      };

      ws.onclose = () => {
        console.log("Conexão WebSocket fechada");
        setConnectionStatus('disconnected');

        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current - 1), 30000); // Exponential backoff up to 30s
          console.log(`Tentando reconectar em ${delay / 1000}s... (Tentativa ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay);
        } else {
          console.error("Máximo de tentativas de reconexão atingido. Verifique a conexão.");
          setConnectionStatus('error');
        }
      };

      ws.onerror = (error) => {
        console.error("Erro WebSocket:", error);
        setConnectionStatus('error'); // Erro explícito de conexão
        // Fecha a conexão para disparar o onclose e o retry logic
        wsRef.current?.close(); 
      };
    } catch (error) {
      console.error("Erro ao tentar conectar WebSocket:", error);
      setConnectionStatus('error');
      // Tenta reconectar imediatamente se for um erro de setup inicial
      if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttemptsRef.current++;
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 1000);
      }
    }
  }, [roomName, clinicId]); // Adiciona clinicId às dependências

  useEffect(() => {
    // Quando o roomName muda, reestabelece a conexão WebSocket para o novo quarto
    if (roomName) {
      if (wsRef.current) {
        wsRef.current.close(); // Fecha a conexão antiga para forçar nova conexão
        wsRef.current = null;
      }
      reconnectAttemptsRef.current = 0; // Reseta as tentativas para um novo quarto
      connectWebSocket();
    } else {
      // Se não há roomName selecionado, desconecta
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setConnectionStatus('disconnected');
    }

    return () => {
      // Limpa tudo ao desmontar ou antes de um novo useEffect
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [roomName, connectWebSocket]);


  // Função para enviar mensagem
  const sendMessage = useCallback(
    async (content: string) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.error("WebSocket não conectado ou não está aberto.");
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

        // Broadcast localmente via Supabase para outras abas/clientes
        if (supabaseChannelRef.current) {
          await supabaseChannelRef.current.send({
            type: "broadcast",
            event: SUPABASE_EVENT_MESSAGE_TYPE,
            payload: localMessage,
          });
        }

        // Envia para o backend via WebSocket
        const wsMessage = JSON.stringify({
          type: "send-message",
          sender: username,
          message: content,
          clinic_id: clinicId,
          phone_number: roomName, // Usa roomName como phone_number
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
    isConnected: connectionStatus === 'connected', // Compatibilidade
    connectionStatus, // Novo status granular
  };
}

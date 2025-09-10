// use-realtime-chat.tsx

"use client";

import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";

interface UseRealtimeChatProps {
  roomName: string;   // normalmente o número do contato (ex: 5599999999999)
  username: string;   // nome do agente/logado
  token?: string;     // token para Authorization se necessário
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

  // Constrói URL WebSocket a partir da base HTTP
  const buildWsUrl = () => {
    const base = ("https://be.blinkdentalmarketing.com.br/api/v1").replace(/\/+$/, "");
    const isHttps = base.startsWith("https://");
    const protocol = isHttps ? "wss://" : "ws://";
    // remove http(s)://
    const withoutProtocol = base.replace(/^https?:\/\//, "");
    // endpoint websocket STOMP (com SockJS) - ajustado para "/wpp-socket"
    return `${protocol}${withoutProtocol}/wpp-socket`;
  };

  // Conecta no STOMP e assina tópicos
  useEffect(() => {
    // Se não há sala (contato selecionado), não conectar
    if (!roomName) return;

    const wsUrl = buildWsUrl();

    const client = new Client({
      // SockJS para compatibilidade
      webSocketFactory: () => new SockJS(wsUrl),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 5000,
      onConnect: () => {
        setIsConnected(true);

        // Função para tratar mensagens recebidas
        const onMessage = (frame: IMessage) => {
          try {
            const payload = JSON.parse(frame.body) as {
              sender: string;
              message: string;
              clinic_id?: number;
              createdAt?: string;
            };

            // filtra por contato/sala
            if (sanitize(payload.sender) !== sanitize(roomName)) return;

            // filtra por clínica se vier no payload
            if (payload.clinic_id != null && Number(payload.clinic_id) !== Number(clinicId)) return;

            const msg: ChatMessage = {
              id: crypto.randomUUID(),
              text: payload.message,
              content: payload.message,
              user: { name: payload.sender || "Contato" },
              createdAt: payload.createdAt || new Date().toISOString(),
            };

            setMessages((current) => {
              // evita duplicar se por algum motivo o mesmo id já existir (pouco provável com randomUUID)
              if (current.some((m) => m.id === msg.id)) return current;
              return [...current, msg];
            });
          } catch (e) {
            // se o servidor enviar texto simples
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

        // Assina os destinos informados pelo backend
        const sub1 = client.subscribe("/wpp-socket/notify/message-received", onMessage);
        // Em caso de o backend também publicar neste destino:
        const sub2 = client.subscribe("/wpp-socket/subscribe", onMessage);

        // guarda unsubscribers
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
      // limpa subscrições e desconecta
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomName, token, clinicId]);

  // Envia mensagem: atualiza localmente para feedback imediato
  // O envio real para WhatsApp continua sendo via REST no componente
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

      // Opcional: caso queira publicar via STOMP também (se o backend tratar):
      // Descomentando abaixo, envia para o destino fornecido.
      // try {
      //   clientRef.current?.publish({
      //     destination: "/wpp-socket/subscribe",
      //     body: JSON.stringify({
      //       sender: sanitize(roomName), // ou username, conforme regra do backend
      //       message: content,
      //       clinic_id: clinicId,
      //     }),
      //     headers: token ? { Authorization: `Bearer ${token}` } : {},
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

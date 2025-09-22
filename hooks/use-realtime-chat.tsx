"use client";

import { ReactNode, useCallback, useState, useEffect } from "react";

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
  // agora isConnected reflete se existe token (útil como fallback)
  const [isConnected, setIsConnected] = useState<boolean>(Boolean(token));

  useEffect(() => {
    setIsConnected(Boolean(token));
  }, [token]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!content || !content.trim()) return;

      const id = (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random()}`;
      const message: ChatMessage = {
        id,
        text: content,
        content,
        user: { name: username },
        createdAt: new Date().toISOString(),
      };

      // mensagem otimista local
      setMessages((current) => [...current, message]);
    },
    [username]
  );

  return {
    messages,
    sendMessage,
    isConnected,
    setMessages,
  };
}

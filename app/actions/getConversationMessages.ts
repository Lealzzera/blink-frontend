'use server';

import axios from 'axios';
import { cookies } from 'next/headers';

type GetConversationMessagesType = {
  clinicId?: number | null;
  page?: number;
  phoneNumber: string;
};

const PAGE_SIZE = 20;
function phoneToChatId(phoneNumber: string): string {
  const digits = phoneNumber.replace(/\D/g, '');
  return `${digits}@c.us`;
}

export async function getConversationMessages({
  page = 0,
  phoneNumber,
}: GetConversationMessagesType) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) {
    throw new Error('User is not authenticated');
  }

  try {
    const chatId = phoneToChatId(phoneNumber);
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_BLINK_BE_BASE_URL}/whatsapp/chats/default/${encodeURIComponent(chatId)}/messages`,
      {
        params: {
          limit: PAGE_SIZE,
          offset: page * PAGE_SIZE,
          sortBy: 'messageTimestamp',
          sortOrder: 'desc',
          downloadMedia: false,
        },
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const data = response.data as {
      messages: {
        id: string;
        message: string | null;
        timestamp: number | null;
        fromMe: boolean;
        source: string | null;
        hasMedia: boolean;
      }[];
      count: number;
    };

    // Mapeia para o shape esperado pelo ChatComponent / MessageComponent
    // (sent_at ISO string, from_me snake_case, message + message_text para
    // compatibilidade com a UI otimista do handleSendMessage).
    return data.messages.map((m) => {
      const text = m.hasMedia ? (m.message ?? 'Mensagem com arquivo de mídia') : (m.message ?? '');
      return {
        id: m.id,
        message: text,
        message_text: text,
        sent_at: m.timestamp ? new Date(m.timestamp * 1000).toISOString() : '',
        from_me: m.fromMe,
        has_media: m.hasMedia,
      };
    });
  } catch (err) {
    console.error('Error fetching conversation messages:', err);
    return [];
  }
}

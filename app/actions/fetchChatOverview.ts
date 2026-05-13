'use server';

import axios from 'axios';
import { cookies } from 'next/headers';

type GetConversationsType = {
  pagination?: {
    limit?: number;
    offset?: number;
  };
  sessionName: string;
};

const PAGE_SIZE = 20;

export async function fetchChatOverview({ pagination, sessionName }: GetConversationsType) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) throw new Error('User is not authenticated');

  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_BLINK_BE_BASE_URL}/whatsapp/chats/${sessionName}/overview`,
      {
        pagination: {
          limit: pagination?.limit ?? PAGE_SIZE,
          offset: pagination?.offset ?? 0,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return response.data;
  } catch (err) {
    console.error('Error fetching conversations:', err);
    return [];
  }
}

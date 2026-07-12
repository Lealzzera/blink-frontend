'use server';

import { cookies } from 'next/headers';

import axios from "axios";
import { serverApiBaseUrl } from './env';

export async function putAiAnswer(phoneNumber: string): Promise<boolean> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) {
    throw new Error('User is not authenticated');
  }

  try {
    const response = await axios.put(
      `${serverApiBaseUrl}/v2/whats-app/chat/ai-answer/${phoneNumber}`,
      null,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return response.data;
  } catch (err) {
    console.error("Error toggling AI answer:", err);
    throw err;
  }
}

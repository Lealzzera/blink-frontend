'use server';

import { cookies } from 'next/headers';

import axios from "axios";

type PostMessageType = {
  clinicId?: number | null;
  message: string;
  phoneNumber: string;
  wait?: number;
};

export async function postMessage({
  clinicId,
  message,
  phoneNumber,
  wait,
}: PostMessageType) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) {
    throw new Error('User is not authenticated');
  }

  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_BLINK_BE_BASE_URL}/v2/whats-app/chat/send-message`,
      {
        clinic_id: clinicId,
        message,
        phone_number: phoneNumber,
        wait: wait || 0,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.data;
  } catch (err) {
    console.error("Error fetching conversations:", err);
  }
}

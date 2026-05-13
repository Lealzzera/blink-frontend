'use server';

import { cookies } from 'next/headers';

import axios from "axios";

export async function deleteAtypicalDay(atypicalDayId: number) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) {
    throw new Error('User is not authenticated');
  }

  try {
    const response = await axios.delete(
      `${process.env.NEXT_PUBLIC_BLINK_BE_BASE_URL}/v1/configuration/availability/atypical/${atypicalDayId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response;
  } catch (err) {
    console.error("Error to delete atypical day:", err);
  }
}

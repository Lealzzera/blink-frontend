'use server';

import { cookies } from 'next/headers';

import { AtypicalConfigurationObject } from "../types/types";
import axios from "axios";

export default async function putUpdateAtypicalDay(
  atypicalObjectBody: AtypicalConfigurationObject,
  atypicalDayId: number
) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) {
    throw new Error('User is not authenticated');
  }

  try {
    const response = await axios.put(
      `${process.env.NEXT_PUBLIC_BLINK_BE_BASE_URL}/v1/configuration/availability/atypical/${atypicalDayId}`,
      atypicalObjectBody,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response;
  } catch (err) {
    console.error("Error to update atypical day:", err);
  }
}

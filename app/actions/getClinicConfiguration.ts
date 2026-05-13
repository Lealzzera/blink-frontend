'use server';

import { cookies } from 'next/headers';

import axios from "axios";

export type ClinicConfigurationResponse = {
  clinic_name: string;
  ai_name: string;
  appointment_duration: number;
  allow_overbooking: boolean;
  custom_prompt: string;
};

export async function getClinicConfiguration(): Promise<ClinicConfigurationResponse | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) {
    throw new Error('User is not authenticated');
  }

  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_BLINK_BE_BASE_URL}/v2/configuration/clinic`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.data;
  } catch (err) {
    console.error("Error fetching clinic configuration:", err);
    return null;
  }
}

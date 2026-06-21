'use server';

import { cookies } from 'next/headers';
import axios from 'axios';

export async function getWhatsAppStatus(clinicId: string, refresh = false) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) {
    throw new Error('User is not authenticated');
  }

  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_BLINK_BE_BASE_URL}/whatsapp/clinics/${clinicId}/status`,
      {
        params: { refresh },
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    // Retorna: { connected, status, sessionName, phoneNumber }
    return response.data as {
      connected: boolean;
      status: string | null;
      sessionName: string | null;
      phoneNumber: string | null;
    };
  } catch (err) {
    console.error('Error fetching WhatsApp status:', err);
    return null;
  }
}

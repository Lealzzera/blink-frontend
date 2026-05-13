'use server';

import axios from 'axios';
import { cookies } from 'next/headers';

export async function getQrCode() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) throw new Error('User is not authenticated');

  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_BLINK_BE_BASE_URL}/whatsapp/qr-code`,
      {
        sessionName: 'default',
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return response.data;
  } catch (err) {
    console.error('Error fetching QR code:', err);
    return null;
  }
}

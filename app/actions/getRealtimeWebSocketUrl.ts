'use server';

import { cookies } from 'next/headers';

export async function getRealtimeWebSocketUrl(clinicId: string) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) {
    return null;
  }

  const websocketUrl = process.env.NEXT_PUBLIC_BLINK_BE_PUBLIC_WS_URL;

  const token = encodeURIComponent(accessToken);

  return `${websocketUrl}/realtime/ws?token=${token}&clinicId=${clinicId}`;
}

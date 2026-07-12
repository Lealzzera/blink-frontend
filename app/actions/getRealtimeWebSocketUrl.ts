'use server';

import { cookies } from 'next/headers';
import { getWebsocketUrl } from './env';

export async function getRealtimeWebSocketUrl(clinicId: string) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) {
    return null;
  }


  const token = encodeURIComponent(accessToken);
  
  const websocketUrl = getWebsocketUrl();
  return `${websocketUrl}/realtime/ws?token=${token}&clinicId=${clinicId}`;
}

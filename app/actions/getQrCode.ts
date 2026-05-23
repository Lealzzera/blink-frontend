'use server';

import { serverApi } from './serverApi';

export async function getQrCode(sessionName: string, clinicId: string) {
  return await serverApi({
    method: 'POST',
    url: '/whatsapp/qr-code',
    data: {
      sessionName,
      clinicId,
    },
  });
}

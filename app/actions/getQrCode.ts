'use server';

import { serverApi } from './serverApi';

export async function getQrCode(clinicId: string) {
  return await serverApi({
    method: 'POST',
    url: '/whatsapp/qr-code',
    data: {
      clinicId,
    },
  });
}

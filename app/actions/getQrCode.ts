'use server';

import { serverApi } from './serverApi';

export async function getQrCode() {
  return await serverApi({
    method: 'POST',
    url: '/whatsapp/qr-code',
    data: {
      sessionName: 'default',
    },
  });
}

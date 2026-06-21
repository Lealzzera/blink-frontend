'use server';

import { serverApi } from './serverApi';

export async function getWhatsappConversationsList(clinicId: string) {
  return await serverApi({
    method: 'GET',
    url: `/whatsapp-conversations/list/${clinicId}`,
  });
}

'use server';

import { serverApi } from './serverApi';

type GetWhatsappConversationParams = {
  clinicId: string;
  chatId: string;
};

export async function getWhatsappConversation({ clinicId, chatId }: GetWhatsappConversationParams) {
  return await serverApi({
    method: 'GET',
    url: `/whatsapp-conversations/${clinicId}/${encodeURIComponent(chatId)}`,
  });
}

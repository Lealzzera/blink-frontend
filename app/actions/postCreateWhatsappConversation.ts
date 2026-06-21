'use server';

import { serverApi } from './serverApi';

type CreateWhatsappConversationParams = {
  clinicId: string;
  chatId: string;
  aiEnabled: boolean;
  session: string;
  phoneNumber: string;
};

export async function createWhatsappConversation({
  clinicId,
  chatId,
  aiEnabled,
  session,
  phoneNumber,
}: CreateWhatsappConversationParams) {
  return await serverApi({
    method: 'POST',
    url: '/whatsapp-conversations/create',
    data: {
      clinicId,
      chatId,
      aiEnabled,
      session,
      phoneNumber,
    },
  });
}

'use server';

import { serverApi } from './serverApi';

type PatchWhatsappConversationParams = {
  clinicId: string;
  chatId: string;
  aiEnabled: boolean;
  session: string;
  phoneNumber: string;
};

export async function patchWhatsappConversation({
  clinicId,
  chatId,
  aiEnabled,
  session,
  phoneNumber,
}: PatchWhatsappConversationParams) {
  return await serverApi({
    method: 'PATCH',
    url: `/whatsapp-conversations/${clinicId}/${encodeURIComponent(chatId)}`,
    data: {
      aiEnabled,
      session,
      phoneNumber,
    },
  });
}

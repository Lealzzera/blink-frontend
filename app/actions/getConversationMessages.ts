'use server';

import { serverApi } from './serverApi';

type GetConversationMessagesType = {
  clinicId?: number | null;
  page?: number;
  phoneNumber: string;
};

const PAGE_SIZE = 20;
function phoneToChatId(phoneNumber: string): string {
  const digits = phoneNumber.replace(/\D/g, '');
  return `${digits}@c.us`;
}

export async function getConversationMessages({
  page = 0,
  phoneNumber,
}: GetConversationMessagesType) {
  const chatId = phoneToChatId(phoneNumber);
  const data = await serverApi({
    method: 'GET',
    url: `/whatsapp/chats/default/${encodeURIComponent(chatId)}/messages`,
    params: {
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
      sortBy: 'messageTimestamp',
      sortOrder: 'desc',
      downloadMedia: false,
    },
  });

  //TODO: REMOVE THIS AND IMPLEMENT THIS LOGIC INTO THE BACKEND INSTEAD

 
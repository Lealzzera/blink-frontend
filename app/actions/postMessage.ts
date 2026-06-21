'use server';

import { serverApi } from './serverApi';

type PostMessageType = {
  chatId: string;
  text: string;
  session: string;
};

export async function postMessage({ chatId, text, session }: PostMessageType) {
  return await serverApi({
    method: 'POST',
    url: '/whatsapp/send-message',
    data: {
      chatId,
      text,
      session,
    },
  });
}

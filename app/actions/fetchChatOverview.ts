'use server';

import { serverApi } from './serverApi';

type GetConversationsType = {
  pagination?: {
    limit?: number;
    offset?: number;
  };
  sessionName: string;
};

const PAGE_SIZE = 20;

export async function fetchChatOverview({ pagination, sessionName }: GetConversationsType) {
  return await serverApi({
    method: 'POST',
    url: `/whatsapp/chats/${sessionName}/overview`,
    data: {
      pagination: {
        limit: pagination?.limit ?? PAGE_SIZE,
        offset: pagination?.offset ?? 0,
      },
    },
  });
}

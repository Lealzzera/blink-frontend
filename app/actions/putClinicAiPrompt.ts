'use server';

import { serverApi } from './serverApi';

type PutClinicAiPromptBody = {
  prompt: string;
};

export async function putClinicAiPrompt({
  prompt,
}: PutClinicAiPromptBody) {
  return await serverApi({
    method: 'POST',
    url: '/clinic-settings/ai-prompt',
    data: { prompt },
  });
}

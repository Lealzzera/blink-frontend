'use server';

import { serverApi } from './serverApi';

type PutClinicAiPromptBody = {
  clinicId: string;
  prompt: string;
};

export async function putClinicAiPrompt({
  clinicId,
  prompt,
}: PutClinicAiPromptBody) {
  return await serverApi({
    method: 'POST',
    url: `/clinic-settings/${clinicId}/ai-prompt`,
    data: { prompt },
  });
}

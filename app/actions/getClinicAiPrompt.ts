'use server';

import { serverApi } from './serverApi';

type ClinicAiPromptResponse = {
  prompt: string;
};

export async function getClinicAiPrompt(): Promise<ClinicAiPromptResponse | null> {
  return await serverApi({
    url: '/clinic-settings/ai-prompt',
  });
}

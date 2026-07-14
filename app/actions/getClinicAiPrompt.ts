'use server';

import { serverApi } from './serverApi';

type ClinicAiPromptResponse = {
  prompt: string;
};

export async function getClinicAiPrompt(
  clinicId: string,
): Promise<ClinicAiPromptResponse | null> {
  return await serverApi({
    url: `/clinic-settings/${clinicId}/ai-prompt`,
  });
}

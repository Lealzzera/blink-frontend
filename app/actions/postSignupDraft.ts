'use server';

import axios from 'axios';
import { SignupDraftData } from '../types/types';
import { serverApiBaseUrl } from './env';

type PostSignupDraftType = {
  fullName: string;
  email: string;
  password: string;
  selectedPlanId: string;
  data: SignupDraftData;
};

export async function postSignupDraft({
  data,
  email,
  password,
  fullName,
  selectedPlanId,
}: PostSignupDraftType): Promise<{ draftId: string } | null> {
  try {
    const response = await axios.post(
      `${serverApiBaseUrl}/signup-draft/register`,
      { email, password, fullName, selectedPlanId, data },
      { headers: { 'Content-Type': 'application/json' } },
    );
    return response.data; // { draftId: string }
  } catch (err) {
    console.error('Error saving signup draft:', err);
    return null;
  }
}

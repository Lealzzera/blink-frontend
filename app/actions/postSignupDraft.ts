'use server';

import axios from 'axios';
import { SignupDraftData } from '../types/types';
import { getServerApiBaseUrl } from './env';

type PostSignupDraftType = {
  fullName: string;
  email: string;
  password: string;
  selectedPlanId: string;
  data: SignupDraftData;
  acceptedTerms: boolean;
};

export async function postSignupDraft({
  data,
  email,
  password,
  fullName,
  selectedPlanId,
  acceptedTerms,
}: PostSignupDraftType): Promise<{ draftId: string } | null> {
  try {
    const serverApiBaseUrl = getServerApiBaseUrl();
    const response = await axios.post(
      `${serverApiBaseUrl}/signup-draft/register`,
      { email, password, fullName, selectedPlanId, data, acceptedTerms },
      { headers: { 'Content-Type': 'application/json' } },
    );
    return response.data; // { draftId: string }
  } catch (err) {
    console.error('Error saving signup draft:', err);
    return null;
  }
}

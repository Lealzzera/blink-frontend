'use server';

import axios from 'axios';
import { SignupDraftData } from '../types/types';

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
      `${process.env.NEXT_PUBLIC_BLINK_BE_BASE_URL}/signup-draft/register`,
      { email, password, fullName, selectedPlanId, data },
      { headers: { 'Content-Type': 'application/json' } },
    );
    return response.data; // { draftId: string }
  } catch (err) {
    console.error('Error saving signup draft:', err);
    return null;
  }
}

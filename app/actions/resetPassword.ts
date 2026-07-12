'use server';

import axios from 'axios';
import { getServerApiBaseUrl } from './env';

type ResetPasswordParams = {
  token: string;
  password: string;
};

export async function resetPassword({ token, password }: ResetPasswordParams) {
  const serverApiBaseUrl = getServerApiBaseUrl();
  try {
    await axios.post(`${serverApiBaseUrl}/auth/reset-password`, {
      token,
      password,
    });

    return { error: null };
  } catch (error) {
    console.error('Error resetting password:', error);
    return { error: 'Token invalido, expirado ou senha invalida.' };
  }
}

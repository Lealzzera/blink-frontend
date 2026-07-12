'use server';

import axios from 'axios';
import { serverApiBaseUrl } from './env';

type ResetPasswordParams = {
  token: string;
  password: string;
};

export async function resetPassword({ token, password }: ResetPasswordParams) {
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

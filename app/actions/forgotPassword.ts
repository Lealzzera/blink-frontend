'use server';

import axios from 'axios';
import { getServerApiBaseUrl } from './env';

export async function forgotPassword(email: string) {
  const serverApiBaseUrl = getServerApiBaseUrl();
  try {
    await axios.post(`${serverApiBaseUrl}/auth/forgot-password`, {
      email,
    });

    return { error: null };
  } catch (error) {
    console.error('Error requesting password reset:', error);
    return { error: 'Nao foi possivel enviar as instrucoes de redefinicao.' };
  }
}

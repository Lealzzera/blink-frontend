'use server';

import axios from 'axios';

export async function forgotPassword(email: string) {
  try {
    await axios.post(`${process.env.NEXT_PUBLIC_BLINK_BE_BASE_URL}/auth/forgot-password`, {
      email,
    });

    return { error: null };
  } catch (error) {
    console.error('Error requesting password reset:', error);
    return { error: 'Nao foi possivel enviar as instrucoes de redefinicao.' };
  }
}

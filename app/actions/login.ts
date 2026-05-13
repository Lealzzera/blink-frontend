'use server';

import axios from 'axios';
import { cookies } from 'next/headers';

type LoginData = {
  email: string;
  password: string;
};

export async function login({ email, password }: LoginData) {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_BLINK_BE_BASE_URL}/auth/login`,
      { email, password },
    );

    const { accessToken, refreshToken } = response.data;

    const cookieStore = await cookies();

    cookieStore.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 dia (alinhado com a expiração do backend)
      path: '/',
      sameSite: 'lax',
    });

    cookieStore.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: '/',
      sameSite: 'lax',
    });

    return { error: null };
  } catch {
    return { error: 'Email ou senha incorretos', user: null };
  }
}

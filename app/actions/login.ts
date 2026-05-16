'use server';

import axios from 'axios';
import { cookies } from 'next/headers';

type LoginData = {
  email: string;
  password: string;
};

export async function login({ email, password }: LoginData) {
  try {
    const response = await axios.post(`${process.env.NEXT_PUBLIC_BLINK_BE_BASE_URL}/auth/login`, {
      email,
      password,
    });

    const { accessToken } = response.data;

    const cookieStore = await cookies();

    cookieStore.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24,
      path: '/',
      sameSite: 'lax',
    });

    const cookieHeader = response.headers['set-cookie'];

    if (cookieHeader?.length) {
      const refreshTokenCookie = cookieHeader[0];
      const refreshTokenValue = refreshTokenCookie.split(';')[0].split('=')[1];

      cookieStore.set('refresh_token', refreshTokenValue, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 14,
        path: '/',
        sameSite: 'lax',
      });
    }

    return { error: null };
  } catch {
    return { error: 'Email ou senha incorretos', user: null };
  }
}

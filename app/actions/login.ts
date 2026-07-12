'use server';

import axios from 'axios';
import { cookies } from 'next/headers';
import { shouldUseSecureCookies } from './authCookieOptions';
import { getServerApiBaseUrl } from './env';

type LoginData = {
  email: string;
  password: string;
};

export async function login({ email, password }: LoginData) {
  try {
    const serverApiBaseUrl = getServerApiBaseUrl();
    console.log('[login] baseURL:', serverApiBaseUrl);
    const response = await axios.post(`${serverApiBaseUrl}/auth/login`, {
      email,
      password,
    });

    const { access_token } = response.data;

    const cookieStore = await cookies();
    const useSecureCookies = await shouldUseSecureCookies();

    cookieStore.set('access_token', access_token, {
      httpOnly: true,
      secure: useSecureCookies,
      maxAge: 60 * 60 * 24 * 14,
      path: '/',
      sameSite: 'lax',
    });

    const cookieHeader = response.headers['set-cookie'];

    if (cookieHeader?.length) {
      const refreshTokenCookie = cookieHeader[0];
      const refreshTokenValue = refreshTokenCookie.split(';')[0].split('=')[1];

      cookieStore.set('refresh_token', refreshTokenValue, {
        httpOnly: true,
        secure: useSecureCookies,
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

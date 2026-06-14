'use server';

import axios, { AxiosRequestConfig } from 'axios';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function serverApi(config: AxiosRequestConfig) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  try {
    const response = await axios({
      ...config,
      baseURL: process.env.NEXT_PUBLIC_BLINK_BE_BASE_URL,
      headers: {
        ...config.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  } catch (err: any) {
    if (err.response?.status !== 401) {
      console.error('Unexpected error:', err);
      cookieStore.delete('access_token');
      cookieStore.delete('refresh_token');
      redirect('/');
    }

    const refreshToken = cookieStore.get('refresh_token')?.value;

    if (!refreshToken) {
      console.error('Refresh token missing');
      cookieStore.delete('access_token');
      cookieStore.delete('refresh_token');
      redirect('/');
    }

    const refreshResponse = await axios
      .post(
        `${process.env.NEXT_PUBLIC_BLINK_BE_BASE_URL}/auth/refresh`,
        {},
        {
          headers: {
            Cookie: `refresh_token=${refreshToken}`,
          },
        },
      )
      .catch((err) => {
        console.error('Invalid refresh token', err);
        cookieStore.delete('access_token');
        cookieStore.delete('refresh_token');
        redirect('/');
      });

    const newAccessToken = refreshResponse?.data?.access_token;

    cookieStore.set('access_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 14,
    });

    const setCookie = refreshResponse?.headers['set-cookie'];

    if (setCookie?.length) {
      const refreshCookie = setCookie.find((cookie: string) => cookie.startsWith('refresh_token='));

      const newRefreshToken = refreshCookie?.split(';')[0].split('=')[1];

      if (newRefreshToken) {
        cookieStore.set('refresh_token', newRefreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 14,
        });
      }
    }

    const retryResponse = await axios({
      ...config,
      baseURL: process.env.NEXT_PUBLIC_BLINK_BE_BASE_URL,
      headers: {
        ...config.headers,
        Authorization: `Bearer ${newAccessToken}`,
      },
    });

    return retryResponse.data;
  }
}

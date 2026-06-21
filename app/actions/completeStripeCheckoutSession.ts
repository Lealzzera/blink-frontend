'use server';

import axios from 'axios';
import { cookies } from 'next/headers';

type CompleteStripeCheckoutSessionResponse = {
  error: string | null;
};

export async function completeStripeCheckoutSession(
  sessionId: string,
): Promise<CompleteStripeCheckoutSessionResponse> {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_BLINK_BE_BASE_URL}/stripe/complete-checkout-session`,
      { sessionId },
      { headers: { 'Content-Type': 'application/json' } },
    );

    const cookieStore = await cookies();
    const { access_token: accessToken } = response.data;

    cookieStore.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 14,
      path: '/',
      sameSite: 'lax',
    });

    const cookieHeader = response.headers['set-cookie'];

    if (cookieHeader?.length) {
      const refreshTokenCookie = cookieHeader.find((cookie: string) =>
        cookie.startsWith('refresh_token='),
      );
      const refreshTokenValue = refreshTokenCookie?.split(';')[0].split('=')[1];

      if (refreshTokenValue) {
        cookieStore.set('refresh_token', refreshTokenValue, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 60 * 60 * 24 * 14,
          path: '/',
          sameSite: 'lax',
        });
      }
    }

    return { error: null };
  } catch (error) {
    console.error('Error completing Stripe checkout session:', error);
    return { error: 'Nao foi possivel finalizar seu cadastro.' };
  }
}

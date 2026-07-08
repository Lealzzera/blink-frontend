'use server';

import { headers } from 'next/headers';

export async function shouldUseSecureCookies() {
  const requestHeaders = await headers();
  const forwardedProto = requestHeaders.get('x-forwarded-proto');
  const publicBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  return publicBaseUrl?.startsWith('https://') || forwardedProto === 'https';
}

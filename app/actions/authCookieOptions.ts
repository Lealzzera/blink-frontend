'use server';

import { headers } from 'next/headers';

export async function shouldUseSecureCookies() {
  const requestHeaders = await headers();
  const forwardedProto = requestHeaders.get('x-forwarded-proto');
  const forwardedSsl = requestHeaders.get('x-forwarded-ssl');
  const forwardedProtocol = requestHeaders.get('x-forwarded-protocol');

  return forwardedProto === 'https' || forwardedProtocol === 'https' || forwardedSsl === 'on';
}

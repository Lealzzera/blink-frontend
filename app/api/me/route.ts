import { cookies } from 'next/headers';

function decodeJwtPayload(token: string) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (!token) {
    return Response.json({ user: null }, { status: 401 });
  }

  const payload = decodeJwtPayload(token);

  if (!payload?.sub) {
    return Response.json({ user: null }, { status: 401 });
  }

  // Verifica se o token não expirou
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    return Response.json({ user: null }, { status: 401 });
  }

  return Response.json(
    { user: { id: payload.sub, email: payload.email, role: payload.role } },
    { status: 200 },
  );
}

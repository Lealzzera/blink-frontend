'use server';

import axios from 'axios';
import { cookies } from 'next/headers';

export async function getClinicId() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) {
    throw new Error('User is not authenticated');
  }

  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_BLINK_BE_BASE_URL}/clinic/me`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return response.data.clinicId;
  } catch (err) {
    console.error('Error fetching clinic ID:', err);
    return null;
  }
}

'use server';

import axios from 'axios';

export async function getPlansList() {
  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_BLINK_BE_BASE_URL}/plans/list`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  } catch (err) {
    console.error('Error fetching plans list:', err);
  }
}

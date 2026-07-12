'use server';

import axios from 'axios';
import { serverApiBaseUrl } from './env';

export async function getPlansList() {
  try {
    const response = await axios.get(`${serverApiBaseUrl}/plans/list`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  } catch (err) {
    console.error('Error fetching plans list:', err);
  }
}

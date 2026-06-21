'use server';

import { serverApi } from './serverApi';

export async function getClinicId() {
  return await serverApi({
    method: 'GET',
    url: '/clinic/me',
  });
}

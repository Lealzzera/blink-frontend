'use server';

import { serverApi } from './serverApi';

export async function getClinicWorkingHours(clinicId: string) {
  const response = await serverApi({
    method: 'GET',
    url: `/clinic-working-hours/${clinicId}`,
  });
  return response;
}

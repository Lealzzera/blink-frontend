'use server';

import { serverApi } from './serverApi';

export async function getAtypicalDaysList(clinicId: string) {
  return await serverApi({
    method: 'GET',
    url: `/clinic-special-date/list/${clinicId}`,
  });
}

'use server';

import { serverApi } from './serverApi';

export async function deleteAtypicalDay(clinicId: string, specialDate: string) {
  return await serverApi({
    method: 'DELETE',
    url: `/clinic-special-date/delete/${clinicId}/${specialDate}`,
  });
}

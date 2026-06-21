'use server';

import { SpecialDatePayload } from './postAtypicalDayAvailability';
import { serverApi } from './serverApi';

export default async function putUpdateAtypicalDay(
  atypicalObjectBody: Omit<SpecialDatePayload, 'clinicId' | 'specialDate'>,
  clinicId: string,
  specialDate: string,
) {
  return await serverApi({
    method: 'PATCH',
    url: `/clinic-special-date/update/${clinicId}/${specialDate}`,
    data: atypicalObjectBody,
  });
}

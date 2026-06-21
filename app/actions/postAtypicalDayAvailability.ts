'use server';

import { serverApi } from './serverApi';

export type SpecialDatePeriod = {
  endTime: string;
  startTime: string;
};

export type SpecialDatePayload = {
  clinicId: string;
  isOpen: boolean;
  note?: string;
  periods?: SpecialDatePeriod[];
  specialDate: string;
};

export default async function postAtypicalDayAvailability(
  atypicalObjectBody: SpecialDatePayload,
) {
  return await serverApi({
    method: 'POST',
    url: '/clinic-special-date/create',
    data: atypicalObjectBody,
  });
}

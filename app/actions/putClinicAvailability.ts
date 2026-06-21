'use server';

import { serverApi } from './serverApi';

export type PutClinicAvailabilityType = {
  endTime: string;
  startTime: string;
  weekday: string;
};

export async function putClinicAvailability(
  clinicId: string,
  workingHours: PutClinicAvailabilityType[],
) {
  return await serverApi({
    method: 'PUT',
    url: `/clinic-working-hours/${clinicId}`,
    data: {
      workingHours,
    },
  });
}

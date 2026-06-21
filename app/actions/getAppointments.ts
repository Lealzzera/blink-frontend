'use server';

import { serverApi } from './serverApi';

type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELED' | 'COMPLETED';

type GetAppointmentsParams = {
  clinicId: string;
  startDate?: string;
  endDate?: string;
  status?: AppointmentStatus;
};

export async function getAppointments({
  clinicId,
  startDate,
  endDate,
  status,
}: GetAppointmentsParams) {
  return await serverApi({
    method: 'GET',
    url: `/appointments/list/${clinicId}`,
    params: {
      startDate,
      endDate,
      status,
    },
  });
}

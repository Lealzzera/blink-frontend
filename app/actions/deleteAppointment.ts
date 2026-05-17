'use server';

import { serverApi } from './serverApi';

type DeleteAppointmentParams = {
  appointmentId: string;
};

export async function deleteAppointment({
  appointmentId,
}: DeleteAppointmentParams) {
  return await serverApi({
    method: 'DELETE',
    url: `/appointments/${appointmentId}`,
  });
}

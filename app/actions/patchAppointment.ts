'use server';

import { serverApi } from './serverApi';

type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELED' | 'COMPLETED';

type PatchAppointmentParams = {
  appointmentId: string;
  customerName?: string;
  customerPhoneNumber?: string;
  appointmentDate?: string;
  time?: string;
  notes?: string | null;
  status?: AppointmentStatus;
};

export async function patchAppointment({
  appointmentId,
  customerName,
  customerPhoneNumber,
  appointmentDate,
  time,
  notes,
  status,
}: PatchAppointmentParams) {
  return await serverApi({
    method: 'PATCH',
    url: `/appointments/${appointmentId}`,
    data: {
      customerName,
      customerPhoneNumber,
      appointmentDate,
      time,
      notes,
      status,
    },
  });
}

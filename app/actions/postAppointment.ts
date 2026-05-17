'use server';

import { serverApi } from './serverApi';

type PostAppointmentParams = {
  clinicId: string;
  customerName: string;
  customerPhoneNumber: string;
  appointmentDate: string;
  time: string;
  notes?: string;
};

export async function postAppointment({
  clinicId,
  customerName,
  customerPhoneNumber,
  appointmentDate,
  time,
  notes,
}: PostAppointmentParams) {
  return await serverApi({
    method: 'POST',
    url: '/appointments',
    data: {
      clinicId,
      customerName,
      customerPhoneNumber,
      appointmentDate,
      time,
      notes,
    },
  });
}

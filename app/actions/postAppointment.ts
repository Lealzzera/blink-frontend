'use server';

import { cookies } from 'next/headers';

import axios from "axios";

type PostAppointmentType = {
  patientName: string;
  patientNumber: string;
  scheduledTime: string;
  notes: string;
};

export async function postAppointment({
  patientNumber,
  scheduledTime,
  notes,
  patientName,
}: PostAppointmentType) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) {
    throw new Error('User is not authenticated');
  }

  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_BLINK_BE_BASE_URL}/v2/appointments`,
      {
        patient_number: patientNumber,
        scheduled_time: scheduledTime,
        patient_name: patientName,
        notes,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return response;
  } catch (err) {
    console.error("Error to create a new appointment:", err);
    return err;
  }
}

'use server';

import { cookies } from 'next/headers';

import axios from "axios";

type PutAppointmentStatusType = {
  appointmentId: string;
  status?: string;
  notes?: string;
  scheduledTime?: string;
};

export async function putAppointmentStatus({
  appointmentId,
  status,
  notes,
  scheduledTime,
}: PutAppointmentStatusType) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) {
    throw new Error('User is not authenticated');
  }

  try {
    const response = await axios.patch(
      `${process.env.NEXT_PUBLIC_BLINK_BE_BASE_URL}/v2/appointments/${appointmentId}`,
      { status, notes, scheduled_time: scheduledTime },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return response.data;
  } catch (err) {
    console.error("Error to update an appointment:", err);
  }
}

import { createClient } from "@/utils/supabase/client";
import axios from "axios";

type PostAppointmentType = {
  patientNumber: string;
  scheduledTime: string;
  notes: string;
  clinicId: number;
};

export async function postAppointment({
  patientNumber,
  scheduledTime,
  notes,
  clinicId,
}: PostAppointmentType) {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const accessToken = session?.access_token;

  if (!accessToken) {
    throw new Error("User is not authenticated");
  }

  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_BLINK_BE_BASE_URL}/appointments`,
      {
        patient_number: patientNumber,
        scheduled_time: scheduledTime,
        notes,
        clinic: clinicId,
        //TODO: remove hardcoded service_type
        service_type: 1,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.data;
  } catch (err) {
    console.error("Error to create a new appointment:", err);
  }
}

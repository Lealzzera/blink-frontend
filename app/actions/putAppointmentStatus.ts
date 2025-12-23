import { createClient } from "@/utils/supabase/client";
import axios from "axios";

type PutAppointmentStatusType = {
  appointmentId: string;
  status: string;
};

export async function putAppointmentStatus({
  appointmentId,
  status,
}: PutAppointmentStatusType) {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const accessToken = session?.access_token;

  if (!accessToken) {
    throw new Error("User is not authenticated");
  }

  try {
    const response = await axios.put(
      `${process.env.NEXT_PUBLIC_BLINK_BE_BASE_URL}/v1/appointments/${appointmentId}`,
      { status },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.data;
  } catch (err) {
    console.error("Error to update an appointment:", err);
  }
}

import { createClient } from "@/utils/supabase/client";
import axios from "axios";

type GetAppointmentsType = {
  clinicId?: number | null;
  startDate: string;
  endDate: string;
};

export async function getAppointments({
  clinicId,
  startDate,
  endDate,
}: GetAppointmentsType) {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const accessToken = session?.access_token;

  if (!accessToken) {
    throw new Error("User is not authenticated");
  }

  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_BLINK_BE_BASE_URL}/v2/appointments/availability?start_date=${startDate}&end_date=${endDate}&hide_cancelled=true`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return response.data;
  } catch (err) {
    console.error("Error fetching appointments list:", err);
  }
}

import { createClient } from "@/utils/supabase/client";
import axios from "axios";

export type PutClinicAvailabilityType = {
  clinic_id?: number | null;
  week_day: string;
  open?: string;
  close?: string;
  break_start?: string;
  break_end?: string;
  is_work_day?: boolean;
};

export async function putClinicAvailability(
  availabilityList: PutClinicAvailabilityType[]
) {
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
      `${process.env.NEXT_PUBLIC_BLINK_BE_BASE_URL}/v1/configuration/availability`,
      availabilityList,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.status;
  } catch (err) {
    console.error("Error to put clinic availability:", err);
  }
}

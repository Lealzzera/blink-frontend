import { createClient } from "@/utils/supabase/client";
import axios from "axios";

export type PutClinicConfigurationBody = {
  clinic_name: string;
  ai_name: string;
  appointment_duration: number;
  allow_overbooking: boolean;
  custom_prompt: string;
};

export async function putClinicConfiguration(
  body: PutClinicConfigurationBody
): Promise<number | null> {
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
      `${process.env.NEXT_PUBLIC_BLINK_BE_BASE_URL}/v2/configuration/clinic`,
      body,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.status;
  } catch (err) {
    console.error("Error updating clinic configuration:", err);
    return null;
  }
}

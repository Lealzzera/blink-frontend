import { createClient } from "@/utils/supabase/client";
import axios from "axios";

type PostMessageType = {
  clinicId?: number | null;
  message: string;
  phoneNumber: string;
  wait?: number;
};

export async function postMessage({
  clinicId,
  message,
  phoneNumber,
  wait,
}: PostMessageType) {
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
      `${process.env.NEXT_PUBLIC_BLINK_BE_BASE_URL}/message/whats-app/send-message`,
      {
        clinic_id: clinicId,
        message,
        phone_number: phoneNumber,
        wait: wait ? wait : 0,
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
    console.error("Error fetching conversations:", err);
  }
}

import { createClient } from "@/utils/supabase/client";
import axios from "axios";

export async function getWhatsAppStatus() {
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
      `${process.env.NEXT_PUBLIC_BLINK_BE_BASE_URL}/v1/message/whats-app/status`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.data;
  } catch (err) {
    console.error("Error fetching WhatsApp status:", err);
  }
}

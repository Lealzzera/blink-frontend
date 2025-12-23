import { createClient } from "@/utils/supabase/client";
import axios from "axios";

export async function deleteWhatsappConnection() {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const accessToken = session?.access_token;

  if (!accessToken) {
    throw new Error("User is not authenticated");
  }

  try {
    const response = await axios.delete(
      `${process.env.NEXT_PUBLIC_BLINK_BE_BASE_URL}/v1/chat/whats-app/disconnect`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (err) {
    console.error("Error to disconnect whatsapp number:", err);
  }
}

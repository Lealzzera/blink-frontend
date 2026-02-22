import { createClient } from "@/utils/supabase/client";
import axios from "axios";

export async function deleteAtypicalDay(atypicalDayId: number) {
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
      `${process.env.NEXT_PUBLIC_BLINK_BE_BASE_URL}/v1/configuration/availability/atypical/${atypicalDayId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response;
  } catch (err) {
    console.error("Error to delete atypical day:", err);
  }
}

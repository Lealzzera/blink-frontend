import { createClient } from "@/utils/supabase/client";
import axios from "axios";

type GetConversationMessagesType = {
  clinicId?: number | null;
  page?: number;
  phoneNumber: string;
};

export async function getConversationMessages({
  clinicId,
  page = 0,
  phoneNumber,
}: GetConversationMessagesType) {
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
      `${process.env.NEXT_PUBLIC_BLINK_BE_BASE_URL}/v1/chat/${clinicId}/overview/${phoneNumber}?page=${page}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.data;
  } catch (err) {
    console.error("Error fetching conversation messages:", err);
  }
}

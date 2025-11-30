import { createClient } from "@/utils/supabase/client";
import axios from "axios";

type GetConversationsType = {
  clinicId?: number | null;
  page?: number;
};

export async function getConversations({
  clinicId,
  page = 0,
}: GetConversationsType) {
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
      `${process.env.NEXT_PUBLIC_BLINK_BE_BASE_URL}/chat/${clinicId}/overview?page=${page}`,
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

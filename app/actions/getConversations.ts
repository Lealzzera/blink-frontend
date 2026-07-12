"use server";

import { createClient } from "@/utils/supabase/server";
import axios from "axios";
import { getServerApiBaseUrl } from "./env";

type GetConversationsType = {
  clinicId?: number | null;
  page?: number;
};

export async function getConversations({
  clinicId,
  page = 0,
}: GetConversationsType) {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const accessToken = session?.access_token;

  if (!accessToken) {
    throw new Error("User is not authenticated");
  }

  try {
    const serverApiBaseUrl = getServerApiBaseUrl();
    const response = await axios.get(
      `${serverApiBaseUrl}/chat/${clinicId}/overview?page=${page}`,
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

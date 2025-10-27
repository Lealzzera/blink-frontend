"use server";

import { createClient } from "@/utils/supabase/server";
import axios from "axios";

type GetQrCodeType = {
  clinicId?: number;
};

export async function getQrCode({ clinicId }: GetQrCodeType) {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const accessToken = session?.access_token;

  if (!accessToken) {
    throw new Error("User is not authenticated");
  }

  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_BLINK_BE_BASE_URL}/message/whats-app/${clinicId}/qr-code`,
      {
        headers: {
          Accept: "image/png",
          Authorization: `Bearer ${accessToken}`,
        },
        responseType: "arraybuffer",
      }
    );

    return Buffer.from(response.data).toString("base64");
  } catch (err) {
    console.error("Error fetching QR code:", err);
  }
}

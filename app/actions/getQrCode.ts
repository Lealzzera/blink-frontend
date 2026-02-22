import { createClient } from "@/utils/supabase/client";
import axios from "axios";

type GetQrCodeType = {
  clinicId?: number;
};

export async function getQrCode() {
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
      `${process.env.NEXT_PUBLIC_BLINK_BE_BASE_URL}/v2/whats-app/auth/qr-code`,
      {
        headers: {
          Accept: "image/png",
          Authorization: `Bearer ${accessToken}`,
        },
        responseType: "arraybuffer",
      }
    );

    // Convert ArrayBuffer to base64 in browser
    if (typeof window !== "undefined") {
      const bytes = new Uint8Array(response.data as ArrayBuffer);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    }

    // Fallback for non-browser (shouldn't be used after this change)
    // @ts-ignore
    return Buffer.from(response.data).toString("base64");
  } catch (err) {
    console.error("Error fetching QR code:", err);
  }
}

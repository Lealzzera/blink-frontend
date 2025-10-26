"use server";

import axios from "axios";
import { cookies } from "next/headers";

type GetQrCodeType = {
  clinicId?: number;
};

export async function getQrCode({ clinicId }: GetQrCodeType) {
  const accessToken = cookies().get("access_token")?.value;
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

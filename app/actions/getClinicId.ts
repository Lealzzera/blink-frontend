"use server";

import axios from "axios";
import { cookies } from "next/headers";

export async function getClinicId() {
  const accessToken = cookies().get("access_token")?.value;
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_BLINK_BE_BASE_URL}/configurations/clinic-id`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    console.log(response);
    return response.data;
  } catch (err) {
    console.error("Error fetching clinic ID:", err);
  }
}

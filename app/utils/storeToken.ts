"use server";

import { cookies } from "next/headers";

export async function storeToken(token: string) {
  const expires = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

  cookies().set("access_token", token, { expires });
}

import { cookies } from "next/headers";

type ApiClientType = {
  path: string;
  method: string;
  headers?: HeadersInit | undefined;
  body?: BodyInit | null | undefined;
};

export async function apiClient({
  path,
  method,
  headers,
  body,
}: ApiClientType) {
  const userTokenFromCookie = cookies().get("access_token");

  const response = await fetch(`${process.env.BACKEND_URL}${path}`, {
    method,
    headers: {
      ...headers,
      Authorization: userTokenFromCookie
        ? `Bearer: ${userTokenFromCookie.value}`
        : "",
      "Content-Type": "application/json",
    },
    body,
    credentials: "include",
  });

  return response;
}

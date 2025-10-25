import { createClient } from "@/lib/client";
import { storeToken } from "../utils/storeToken";

interface loginData {
  email: string;
  password: string;
}

export async function login({ email, password }: loginData) {
  const supabase = createClient();
  try {
    const response = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    const userAccessToken = response.data.session?.access_token;

    if (userAccessToken) storeToken(userAccessToken);

    return { data: response.data, error: response.error };
  } catch (err) {
    console.error({ err });
  }
}

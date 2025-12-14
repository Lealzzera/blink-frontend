import { createClient } from "@/utils/supabase/client";

export async function forgotPassword(email: string) {
  const supabase = createClient();

  const { error, data } = await supabase.auth.resetPasswordForEmail(email);

  return { error, data };
}

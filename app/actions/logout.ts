import { createClient } from "@/utils/supabase/client";

export async function logout() {
  const supabase = createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: error.message };
  }

  // On client, perform a full navigation to the homepage to emulate
  // the previous server-side redirect and reload session state.
  if (typeof window !== "undefined") {
    window.location.href = "/";
  }

  return { error: null };
}

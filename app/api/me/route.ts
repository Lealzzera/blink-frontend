import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const response = await supabase.auth.getUser();

  if (response.error) {
    return Response.json({ user: null }, { status: 401 });
  }

  return Response.json({ user: response.data.user }, { status: 200 });
}

"use server";
import { createClient } from "@/utils/supabase/server";

type LoginData = {
  email: string;
  password: string;
};

export async function login({ email, password }: LoginData) {
  const supabase = await createClient();

  const data = {
    email,
    password,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error: error.message, user: null };
  }

  return { error: null, data };
}

// TODO: IMPLEMENT SIGNUP FUNCTION LATER

// export async function signup(formData: FormData) {
//   const supabase = await createClient();

//   const data = {
//     email: formData.get("email") as string,
//     password: formData.get("password") as string,
//   };

//   const { error } = await supabase.auth.signUp(data);

//   if (error) {
//     redirect("/error");
//   }

//   revalidatePath("/", "layout");
//   redirect("/");
// }

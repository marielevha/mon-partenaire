"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

type ActionResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      message: string;
    };

const getValue = (formData: FormData, key: string) => {
  const value = formData.get(key);
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

export const loginAction = async (
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> => {
  const email = getValue(formData, "email");
  const password = getValue(formData, "password");

  if (!email || !password) {
    return {
      ok: false,
      message: "Merci de renseigner votre email et votre mot de passe.",
    };
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      ok: false,
      message: "Email ou mot de passe incorrect.",
    };
  }

  redirect("/app");
};

export const signupAction = async (
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> => {
  const fullName = getValue(formData, "name");
  const email = getValue(formData, "email");
  const password = getValue(formData, "password");

  if (!fullName || !email || !password) {
    return {
      ok: false,
      message: "Merci de compléter tous les champs.",
    };
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return {
      ok: false,
      message: "Impossible de créer votre compte pour le moment.",
    };
  }

  redirect("/app/onboarding");
};

export const logoutAction = async (): Promise<void> => {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
};

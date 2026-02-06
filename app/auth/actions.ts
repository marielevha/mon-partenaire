"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

type ActionResult =
  | {
      ok: true;
      full_name?: string;
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

  console.log("Login action called with:", { email, password });
  if (!email || !password) {
    return {
      ok: false,
      message: "Merci de renseigner votre email et votre mot de passe.",
    };
  }

  const supabase = await createSupabaseServerClient();
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

  // Récupérer la session et le profil utilisateur
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user.id) {
    return {
      ok: false,
      message: "Impossible de récupérer les informations de profil.",
    };
  }

  // Récupérer le profil depuis la table profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", session.user.id)
    .single();

  return {
    ok: true,
    full_name: profile?.full_name || session.user.user_metadata?.full_name || email,
  };
};

export const signupAction = async (
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> => {
  const fullName = getValue(formData, "name");
  const email = getValue(formData, "email");
  const phone = getValue(formData, "phone");
  const password = getValue(formData, "password");

  if (!fullName || !email || !password) {
    return {
      ok: false,
      message: "Merci de compléter tous les champs.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone: phone,
      },
    },
  });

  if (error) {
    return {
      ok: false,
      message: "Impossible de créer votre compte pour le moment.",
    };
  }
  // Compte créé — rediriger vers la page de connexion
  redirect("/auth/login");
};

export const logoutAction = async (): Promise<void> => {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
};

export const getSessionAction = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
};

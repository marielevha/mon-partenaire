"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { getServerActionLogger } from "@/src/lib/logging/server-action";

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
  const actionLogger = await getServerActionLogger("auth.login");
  const anonymousLogger = actionLogger.child({ userId: "anonymous" });
  const email = getValue(formData, "email");
  const password = getValue(formData, "password");

  anonymousLogger.info("Login action called", {
    emailDomain: email.includes("@") ? email.split("@")[1] : "unknown",
  });
  if (!email || !password) {
    anonymousLogger.warn("Login rejected: missing credentials");
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
    anonymousLogger.warn("Login failed: invalid credentials");
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
    anonymousLogger.error("Login failed: missing session user id");
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

  const userLogger = actionLogger.child({ userId: session.user.id });
  userLogger.info("Login succeeded");

  return {
    ok: true,
    full_name: profile?.full_name || session.user.user_metadata?.full_name || email,
  };
};

export const signupAction = async (
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> => {
  const actionLogger = await getServerActionLogger("auth.signup");
  const anonymousLogger = actionLogger.child({ userId: "anonymous" });
  const fullName = getValue(formData, "name");
  const email = getValue(formData, "email");
  const phone = getValue(formData, "phone");
  const password = getValue(formData, "password");

  if (!fullName || !email || !password) {
    anonymousLogger.warn("Signup rejected: missing required fields");
    return {
      ok: false,
      message: "Merci de compléter tous les champs.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
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
    anonymousLogger.error("Signup failed", {
      errorMessage: error.message,
      emailDomain: email.includes("@") ? email.split("@")[1] : "unknown",
    });
    return {
      ok: false,
      message: "Impossible de créer votre compte pour le moment.",
    };
  }
  const userLogger = actionLogger.child({
    userId: data.user?.id ?? "pending-verification",
  });
  userLogger.info("Signup succeeded", {
    emailDomain: email.includes("@") ? email.split("@")[1] : "unknown",
    hasPhone: Boolean(phone),
  });
  // Compte créé — rediriger vers la page de connexion
  redirect("/auth/login");
};

export const logoutAction = async (): Promise<void> => {
  const actionLogger = await getServerActionLogger("auth.logout");
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userLogger = actionLogger.child({
    userId: session?.user?.id ?? "anonymous",
  });

  await supabase.auth.signOut();
  userLogger.info("Logout succeeded");
  redirect("/auth/login");
};

export const getSessionAction = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
};

"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

type ProfileField = "fullName" | "phone" | "avatarUrl";
type PasswordField = "currentPassword" | "newPassword" | "confirmPassword";

type ProfileUpdateSuccess = {
  ok: true;
  message: string;
};

type ProfileUpdateError = {
  ok: false;
  message: string;
  fieldErrors?: Partial<Record<ProfileField, string>>;
};

export type ProfileUpdateState = ProfileUpdateSuccess | ProfileUpdateError | null;

type PasswordUpdateSuccess = {
  ok: true;
  message: string;
};

type PasswordUpdateError = {
  ok: false;
  message: string;
  fieldErrors?: Partial<Record<PasswordField, string>>;
};

export type PasswordUpdateState = PasswordUpdateSuccess | PasswordUpdateError | null;

function getValue(formData: FormData, key: string) {
  const rawValue = formData.get(key);
  return typeof rawValue === "string" ? rawValue.trim() : "";
}

function getRawValue(formData: FormData, key: string) {
  const rawValue = formData.get(key);
  return typeof rawValue === "string" ? rawValue : "";
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function updateDashboardProfileAction(
  _prevState: ProfileUpdateState,
  formData: FormData
): Promise<ProfileUpdateState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    return {
      ok: false,
      message: "Session invalide. Veuillez vous reconnecter.",
    };
  }

  const fullName = getValue(formData, "fullName");
  const phone = getValue(formData, "phone");
  const avatarUrl = getValue(formData, "avatarUrl");

  const fieldErrors: Partial<Record<ProfileField, string>> = {};

  if (fullName.length < 2) {
    fieldErrors.fullName = "Le nom complet doit contenir au moins 2 caractères.";
  } else if (fullName.length > 120) {
    fieldErrors.fullName = "Le nom complet est trop long (120 caractères max).";
  }

  if (phone.length > 0) {
    if (phone.length < 7 || phone.length > 30) {
      fieldErrors.phone = "Le numéro de téléphone doit contenir entre 7 et 30 caractères.";
    } else if (!/^[+0-9()\s.-]+$/.test(phone)) {
      fieldErrors.phone = "Le format du numéro de téléphone semble invalide.";
    }
  }

  if (avatarUrl.length > 0 && !isHttpUrl(avatarUrl)) {
    fieldErrors.avatarUrl = "L'URL de l'avatar doit commencer par http:// ou https://";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      message: "Le formulaire contient des erreurs.",
      fieldErrors,
    };
  }

  const profilePayload = {
    id: session.user.id,
    full_name: fullName,
    phone: phone || null,
    avatar_url: avatarUrl || null,
    updated_at: new Date().toISOString(),
  };

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(profilePayload, { onConflict: "id" });

  if (profileError) {
    return {
      ok: false,
      message: "Impossible de mettre à jour le profil pour le moment.",
    };
  }

  const { error: metadataError } = await supabase.auth.updateUser({
    data: {
      full_name: fullName,
      phone: phone || null,
      avatar_url: avatarUrl || null,
    },
  });

  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");

  if (metadataError) {
    return {
      ok: true,
      message:
        "Profil enregistré. Les métadonnées de session n'ont pas pu être synchronisées.",
    };
  }

  return {
    ok: true,
    message: "Profil mis à jour avec succès.",
  };
}

export async function updateDashboardPasswordAction(
  _prevState: PasswordUpdateState,
  formData: FormData
): Promise<PasswordUpdateState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    return {
      ok: false,
      message: "Session invalide. Veuillez vous reconnecter.",
    };
  }

  const currentPassword = getRawValue(formData, "currentPassword");
  const newPassword = getRawValue(formData, "newPassword");
  const confirmPassword = getRawValue(formData, "confirmPassword");

  const fieldErrors: Partial<Record<PasswordField, string>> = {};

  if (!currentPassword) {
    fieldErrors.currentPassword = "Le mot de passe actuel est requis.";
  }
  if (!newPassword) {
    fieldErrors.newPassword = "Le nouveau mot de passe est requis.";
  } else if (newPassword.length < 8) {
    fieldErrors.newPassword = "Le nouveau mot de passe doit contenir au moins 8 caractères.";
  } else if (newPassword.length > 128) {
    fieldErrors.newPassword = "Le nouveau mot de passe est trop long (128 caractères max).";
  } else if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
    fieldErrors.newPassword =
      "Le nouveau mot de passe doit contenir au moins une lettre et un chiffre.";
  }

  if (!confirmPassword) {
    fieldErrors.confirmPassword = "Veuillez confirmer le nouveau mot de passe.";
  } else if (confirmPassword !== newPassword) {
    fieldErrors.confirmPassword = "La confirmation ne correspond pas au nouveau mot de passe.";
  }

  if (currentPassword && newPassword && currentPassword === newPassword) {
    fieldErrors.newPassword =
      "Le nouveau mot de passe doit être différent du mot de passe actuel.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      message: "Le formulaire contient des erreurs.",
      fieldErrors,
    };
  }

  if (!session.user.email) {
    return {
      ok: false,
      message:
        "Adresse email introuvable pour ce compte. Impossible de vérifier le mot de passe actuel.",
    };
  }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: session.user.email,
    password: currentPassword,
  });

  if (verifyError) {
    return {
      ok: false,
      message: "Le mot de passe actuel est incorrect.",
      fieldErrors: {
        currentPassword: "Mot de passe actuel invalide.",
      },
    };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    return {
      ok: false,
      message: "Impossible de mettre à jour le mot de passe pour le moment.",
    };
  }

  revalidatePath("/dashboard/profile");

  return {
    ok: true,
    message: "Mot de passe mis à jour avec succès.",
  };
}

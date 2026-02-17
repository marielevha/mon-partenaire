import "server-only";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import type { RbacPermissionCode } from "@/src/lib/rbac/permissions";
import {
  getUserRbacSnapshot,
  type UserRbacSnapshot,
} from "@/src/lib/rbac/core";

export type CurrentUserRbacContext = UserRbacSnapshot & {
  userId: string;
  email: string | null;
};

export async function getCurrentUserRbacContext(): Promise<CurrentUserRbacContext> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const snapshot = await getUserRbacSnapshot(session.user.id);

  return {
    userId: session.user.id,
    email: session.user.email ?? null,
    roleCodes: snapshot.roleCodes,
    permissionCodes: snapshot.permissionCodes,
  };
}

export async function requireCurrentUserPermission(
  permissionCode: RbacPermissionCode,
  options?: {
    redirectTo?: string;
  }
): Promise<CurrentUserRbacContext> {
  const context = await getCurrentUserRbacContext();

  if (!context.permissionCodes.includes(permissionCode)) {
    redirect(options?.redirectTo ?? "/dashboard");
  }

  return context;
}

export async function requireCurrentUserAnyPermission(
  permissionCodes: RbacPermissionCode[],
  options?: {
    redirectTo?: string;
  }
): Promise<CurrentUserRbacContext> {
  const context = await getCurrentUserRbacContext();
  const permissionSet = new Set(context.permissionCodes);

  if (!permissionCodes.some((permissionCode) => permissionSet.has(permissionCode))) {
    redirect(options?.redirectTo ?? "/dashboard");
  }

  return context;
}

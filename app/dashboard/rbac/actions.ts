"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import prisma from "@/src/lib/prisma";
import { getServerActionLogger } from "@/src/lib/logging/server-action";
import { RBAC_PERMISSIONS } from "@/src/lib/rbac/permissions";
import { userHasPermission } from "@/src/lib/rbac/core";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export type RbacActionState =
  | {
      ok: true;
      message: string;
    }
  | {
      ok: false;
      message: string;
    }
  | null;

const PROTECTED_ROLE_CODES = new Set(["member", "operator", "admin", "super_admin"]);
const PROTECTED_PERMISSION_CODES = new Set([
  "dashboard.access",
  "dashboard.overview.read",
  "dashboard.projects.read",
  "dashboard.projects.create",
  "dashboard.projects.update.own",
  "dashboard.projects.update.any",
  "dashboard.document_templates.read",
  "dashboard.document_templates.create",
  "dashboard.document_templates.update.own",
  "dashboard.document_templates.update.any",
  "dashboard.profile.read",
  "dashboard.profile.update.own",
  "dashboard.notifications.read",
  "dashboard.notifications.manage.own",
  "dashboard.pilotage.read",
  "dashboard.quality.read",
  "dashboard.quality.notify",
  "dashboard.logs.read",
  "rbac.roles.read",
  "rbac.roles.manage",
  "rbac.user_roles.read",
  "rbac.user_roles.manage",
]);

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function deduplicate(values: string[]) {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    if (!value || seen.has(value)) {
      continue;
    }
    seen.add(value);
    output.push(value);
  }

  return output;
}

function normalizeCode(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function normalizeText(value: string, maxLength: number) {
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function parseBoolean(value: string) {
  return value === "on" || value === "true" || value === "1";
}

function revalidateRbacPaths() {
  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/rbac");
}

export async function updateRolePermissionsAction(
  _prevState: RbacActionState,
  formData: FormData
): Promise<RbacActionState> {
  const actionLogger = await getServerActionLogger("dashboard.rbac.role-permissions.update");
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    return {
      ok: false,
      message: "Session invalide. Reconnectez-vous.",
    };
  }

  const userLogger = actionLogger.child({ userId: session.user.id });
  const canManage = await userHasPermission(
    session.user.id,
    RBAC_PERMISSIONS.RBAC_ROLES_MANAGE
  );

  if (!canManage) {
    userLogger.warn("Update role permissions rejected: missing permission");
    return {
      ok: false,
      message: "Accès refusé. Vous ne pouvez pas modifier les permissions des rôles.",
    };
  }

  const roleId = getValue(formData, "roleId");
  if (!isUuid(roleId)) {
    return {
      ok: false,
      message: "Rôle invalide.",
    };
  }

  const requestedPermissionCodes = deduplicate(
    formData
      .getAll("permissionCodes")
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean)
  );

  const roleRows = await prisma.$queryRaw<Array<{ id: string; code: string }>>`
    SELECT "id"::text AS "id", "code"
    FROM public."Role"
    WHERE "id" = ${roleId}::uuid
    LIMIT 1
  `;

  const role = roleRows[0];
  if (!role) {
    return {
      ok: false,
      message: "Rôle introuvable.",
    };
  }

  const permissionRows = requestedPermissionCodes.length
    ? await prisma.$queryRaw<Array<{ id: string; code: string }>>`
        SELECT "id"::text AS "id", "code"
        FROM public."Permission"
        WHERE "code" IN (${Prisma.join(requestedPermissionCodes)})
      `
    : [];

  if (permissionRows.length !== requestedPermissionCodes.length) {
    return {
      ok: false,
      message: "Une ou plusieurs permissions sélectionnées sont invalides.",
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      DELETE FROM public."RolePermission"
      WHERE "roleId" = ${roleId}::uuid
    `;

    if (permissionRows.length > 0) {
      const valuesSql = Prisma.join(
        permissionRows.map((permission) =>
          Prisma.sql`(${roleId}::uuid, ${permission.id}::uuid)`
        )
      );

      await tx.$executeRaw`
        INSERT INTO public."RolePermission" ("roleId", "permissionId")
        VALUES ${valuesSql}
        ON CONFLICT ("roleId", "permissionId") DO NOTHING
      `;
    }
  });

  userLogger.info("Role permissions updated", {
    roleId,
    roleCode: role.code,
    permissionCount: permissionRows.length,
  });

  revalidateRbacPaths();

  return {
    ok: true,
    message: `Permissions mises à jour pour le rôle ${role.code}.`,
  };
}

export async function assignUserRoleAction(
  _prevState: RbacActionState,
  formData: FormData
): Promise<RbacActionState> {
  const actionLogger = await getServerActionLogger("dashboard.rbac.user-role.assign");
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    return {
      ok: false,
      message: "Session invalide. Reconnectez-vous.",
    };
  }

  const userLogger = actionLogger.child({ userId: session.user.id });
  const canManage = await userHasPermission(
    session.user.id,
    RBAC_PERMISSIONS.RBAC_USER_ROLES_MANAGE
  );

  if (!canManage) {
    userLogger.warn("Assign role rejected: missing permission");
    return {
      ok: false,
      message: "Accès refusé. Vous ne pouvez pas affecter de rôle.",
    };
  }

  const targetUserId = getValue(formData, "targetUserId");
  const roleId = getValue(formData, "roleId");

  if (!isUuid(targetUserId) || !isUuid(roleId)) {
    return {
      ok: false,
      message: "Utilisateur ou rôle invalide.",
    };
  }

  const roleRows = await prisma.$queryRaw<Array<{ id: string; code: string }>>`
    SELECT "id"::text AS "id", "code"
    FROM public."Role"
    WHERE "id" = ${roleId}::uuid
    LIMIT 1
  `;

  const role = roleRows[0];
  if (!role) {
    return {
      ok: false,
      message: "Rôle introuvable.",
    };
  }

  await prisma.$executeRaw`
    INSERT INTO public."UserRole" ("userId", "roleId", "assignedByUserId")
    VALUES (${targetUserId}::uuid, ${roleId}::uuid, ${session.user.id}::uuid)
    ON CONFLICT ("userId", "roleId") DO NOTHING
  `;

  userLogger.info("User role assigned", {
    targetUserId,
    roleCode: role.code,
  });

  revalidateRbacPaths();

  return {
    ok: true,
    message: `Rôle ${role.code} affecté avec succès.`,
  };
}

export async function revokeUserRoleAction(
  _prevState: RbacActionState,
  formData: FormData
): Promise<RbacActionState> {
  const actionLogger = await getServerActionLogger("dashboard.rbac.user-role.revoke");
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    return {
      ok: false,
      message: "Session invalide. Reconnectez-vous.",
    };
  }

  const userLogger = actionLogger.child({ userId: session.user.id });
  const canManage = await userHasPermission(
    session.user.id,
    RBAC_PERMISSIONS.RBAC_USER_ROLES_MANAGE
  );

  if (!canManage) {
    userLogger.warn("Revoke role rejected: missing permission");
    return {
      ok: false,
      message: "Accès refusé. Vous ne pouvez pas retirer un rôle.",
    };
  }

  const userRoleId = getValue(formData, "userRoleId");
  if (!isUuid(userRoleId)) {
    return {
      ok: false,
      message: "Affectation invalide.",
    };
  }

  const assignmentRows = await prisma.$queryRaw<
    Array<{ id: string; roleCode: string; targetUserId: string }>
  >`
    SELECT
      ur."id"::text AS "id",
      r."code" AS "roleCode",
      ur."userId"::text AS "targetUserId"
    FROM public."UserRole" ur
    JOIN public."Role" r ON r."id" = ur."roleId"
    WHERE ur."id" = ${userRoleId}::uuid
    LIMIT 1
  `;

  const assignment = assignmentRows[0];
  if (!assignment) {
    return {
      ok: false,
      message: "Affectation introuvable.",
    };
  }

  if (assignment.roleCode === "super_admin") {
    const countRows = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*)::int AS count
      FROM public."UserRole" ur
      JOIN public."Role" r ON r."id" = ur."roleId"
      WHERE r."code" = 'super_admin'
    `;

    if ((countRows[0]?.count ?? 0) <= 1) {
      return {
        ok: false,
        message:
          "Impossible de retirer le dernier super_admin. Affectez d'abord ce rôle à un autre utilisateur.",
      };
    }
  }

  await prisma.$executeRaw`
    DELETE FROM public."UserRole"
    WHERE "id" = ${userRoleId}::uuid
  `;

  userLogger.info("User role revoked", {
    userRoleId,
    targetUserId: assignment.targetUserId,
    roleCode: assignment.roleCode,
  });

  revalidateRbacPaths();

  return {
    ok: true,
    message: `Rôle ${assignment.roleCode} retiré avec succès.`,
  };
}

export async function createRoleAction(
  _prevState: RbacActionState,
  formData: FormData
): Promise<RbacActionState> {
  const actionLogger = await getServerActionLogger("dashboard.rbac.role.create");
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    return { ok: false, message: "Session invalide. Reconnectez-vous." };
  }

  const userLogger = actionLogger.child({ userId: session.user.id });
  const canManage = await userHasPermission(
    session.user.id,
    RBAC_PERMISSIONS.RBAC_ROLES_MANAGE
  );

  if (!canManage) {
    userLogger.warn("Create role rejected: missing permission");
    return {
      ok: false,
      message: "Accès refusé. Vous ne pouvez pas créer de rôle.",
    };
  }

  const code = normalizeCode(getValue(formData, "code"));
  const name = normalizeText(getValue(formData, "name"), 120);
  const description = normalizeText(getValue(formData, "description"), 320);
  const isSystem = parseBoolean(getValue(formData, "isSystem"));

  if (!code || code.length < 3) {
    return {
      ok: false,
      message: "Le code du rôle est invalide (minimum 3 caractères).",
    };
  }

  if (!name || name.length < 2) {
    return {
      ok: false,
      message: "Le nom du rôle est invalide.",
    };
  }

  const existingRows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT "id"::text AS "id"
    FROM public."Role"
    WHERE "code" = ${code}
    LIMIT 1
  `;
  if (existingRows.length > 0) {
    return {
      ok: false,
      message: "Ce code de rôle existe déjà.",
    };
  }

  await prisma.$executeRaw`
    INSERT INTO public."Role" ("code", "name", "description", "isSystem")
    VALUES (${code}, ${name}, ${description || null}, ${isSystem})
  `;

  userLogger.info("Role created", { code, isSystem });
  revalidateRbacPaths();

  return {
    ok: true,
    message: `Rôle ${code} créé avec succès.`,
  };
}

export async function updateRoleAction(
  _prevState: RbacActionState,
  formData: FormData
): Promise<RbacActionState> {
  const actionLogger = await getServerActionLogger("dashboard.rbac.role.update");
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    return { ok: false, message: "Session invalide. Reconnectez-vous." };
  }

  const userLogger = actionLogger.child({ userId: session.user.id });
  const canManage = await userHasPermission(
    session.user.id,
    RBAC_PERMISSIONS.RBAC_ROLES_MANAGE
  );

  if (!canManage) {
    userLogger.warn("Update role rejected: missing permission");
    return {
      ok: false,
      message: "Accès refusé. Vous ne pouvez pas modifier de rôle.",
    };
  }

  const roleId = getValue(formData, "roleId");
  const code = normalizeCode(getValue(formData, "code"));
  const name = normalizeText(getValue(formData, "name"), 120);
  const description = normalizeText(getValue(formData, "description"), 320);
  const isSystem = parseBoolean(getValue(formData, "isSystem"));

  if (!isUuid(roleId) || !code || !name) {
    return {
      ok: false,
      message: "Paramètres de rôle invalides.",
    };
  }

  const roleRows = await prisma.$queryRaw<
    Array<{ id: string; code: string; isSystem: boolean }>
  >`
    SELECT "id"::text AS "id", "code", "isSystem"
    FROM public."Role"
    WHERE "id" = ${roleId}::uuid
    LIMIT 1
  `;
  const role = roleRows[0];

  if (!role) {
    return {
      ok: false,
      message: "Rôle introuvable.",
    };
  }

  if (PROTECTED_ROLE_CODES.has(role.code) && code !== role.code) {
    return {
      ok: false,
      message: "Le code de ce rôle système ne peut pas être modifié.",
    };
  }

  const duplicateCodeRows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT "id"::text AS "id"
    FROM public."Role"
    WHERE "code" = ${code}
      AND "id" <> ${roleId}::uuid
    LIMIT 1
  `;

  if (duplicateCodeRows.length > 0) {
    return {
      ok: false,
      message: "Ce code de rôle est déjà utilisé.",
    };
  }

  await prisma.$executeRaw`
    UPDATE public."Role"
    SET
      "code" = ${code},
      "name" = ${name},
      "description" = ${description || null},
      "isSystem" = ${role.isSystem ? true : isSystem}
    WHERE "id" = ${roleId}::uuid
  `;

  userLogger.info("Role updated", {
    roleId,
    oldCode: role.code,
    newCode: code,
  });
  revalidateRbacPaths();

  return {
    ok: true,
    message: `Rôle ${code} mis à jour.`,
  };
}

export async function deleteRoleAction(
  _prevState: RbacActionState,
  formData: FormData
): Promise<RbacActionState> {
  const actionLogger = await getServerActionLogger("dashboard.rbac.role.delete");
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    return { ok: false, message: "Session invalide. Reconnectez-vous." };
  }

  const userLogger = actionLogger.child({ userId: session.user.id });
  const canManage = await userHasPermission(
    session.user.id,
    RBAC_PERMISSIONS.RBAC_ROLES_MANAGE
  );

  if (!canManage) {
    userLogger.warn("Delete role rejected: missing permission");
    return {
      ok: false,
      message: "Accès refusé. Vous ne pouvez pas supprimer de rôle.",
    };
  }

  const roleId = getValue(formData, "roleId");
  if (!isUuid(roleId)) {
    return {
      ok: false,
      message: "Rôle invalide.",
    };
  }

  const roleRows = await prisma.$queryRaw<
    Array<{ id: string; code: string; isSystem: boolean }>
  >`
    SELECT "id"::text AS "id", "code", "isSystem"
    FROM public."Role"
    WHERE "id" = ${roleId}::uuid
    LIMIT 1
  `;
  const role = roleRows[0];
  if (!role) {
    return {
      ok: false,
      message: "Rôle introuvable.",
    };
  }

  if (PROTECTED_ROLE_CODES.has(role.code) || role.isSystem) {
    return {
      ok: false,
      message: "Ce rôle système ne peut pas être supprimé.",
    };
  }

  const assignmentRows = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT COUNT(*)::int AS count
    FROM public."UserRole"
    WHERE "roleId" = ${roleId}::uuid
  `;
  if ((assignmentRows[0]?.count ?? 0) > 0) {
    return {
      ok: false,
      message: "Ce rôle est encore affecté à des utilisateurs. Retirez les affectations d'abord.",
    };
  }

  await prisma.$executeRaw`
    DELETE FROM public."Role"
    WHERE "id" = ${roleId}::uuid
  `;

  userLogger.info("Role deleted", { roleId, code: role.code });
  revalidateRbacPaths();

  return {
    ok: true,
    message: `Rôle ${role.code} supprimé.`,
  };
}

export async function createPermissionAction(
  _prevState: RbacActionState,
  formData: FormData
): Promise<RbacActionState> {
  const actionLogger = await getServerActionLogger("dashboard.rbac.permission.create");
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    return { ok: false, message: "Session invalide. Reconnectez-vous." };
  }

  const userLogger = actionLogger.child({ userId: session.user.id });
  const canManage = await userHasPermission(
    session.user.id,
    RBAC_PERMISSIONS.RBAC_ROLES_MANAGE
  );

  if (!canManage) {
    userLogger.warn("Create permission rejected: missing permission");
    return {
      ok: false,
      message: "Accès refusé. Vous ne pouvez pas créer de permission.",
    };
  }

  const code = normalizeCode(getValue(formData, "code"));
  const resource = normalizeText(getValue(formData, "resource"), 120).toLowerCase();
  const action = normalizeText(getValue(formData, "action"), 120).toLowerCase();
  const description = normalizeText(getValue(formData, "description"), 320);

  if (!code || !resource || !action) {
    return {
      ok: false,
      message: "Code, ressource et action sont obligatoires.",
    };
  }

  const duplicateRows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT "id"::text AS "id"
    FROM public."Permission"
    WHERE "code" = ${code}
    LIMIT 1
  `;

  if (duplicateRows.length > 0) {
    return {
      ok: false,
      message: "Ce code de permission existe déjà.",
    };
  }

  await prisma.$executeRaw`
    INSERT INTO public."Permission" ("code", "resource", "action", "description")
    VALUES (${code}, ${resource}, ${action}, ${description || null})
  `;

  userLogger.info("Permission created", { code, resource, action });
  revalidateRbacPaths();

  return {
    ok: true,
    message: `Permission ${code} créée avec succès.`,
  };
}

export async function updatePermissionAction(
  _prevState: RbacActionState,
  formData: FormData
): Promise<RbacActionState> {
  const actionLogger = await getServerActionLogger("dashboard.rbac.permission.update");
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    return { ok: false, message: "Session invalide. Reconnectez-vous." };
  }

  const userLogger = actionLogger.child({ userId: session.user.id });
  const canManage = await userHasPermission(
    session.user.id,
    RBAC_PERMISSIONS.RBAC_ROLES_MANAGE
  );

  if (!canManage) {
    userLogger.warn("Update permission rejected: missing permission");
    return {
      ok: false,
      message: "Accès refusé. Vous ne pouvez pas modifier de permission.",
    };
  }

  const permissionId = getValue(formData, "permissionId");
  const code = normalizeCode(getValue(formData, "code"));
  const resource = normalizeText(getValue(formData, "resource"), 120).toLowerCase();
  const action = normalizeText(getValue(formData, "action"), 120).toLowerCase();
  const description = normalizeText(getValue(formData, "description"), 320);

  if (!isUuid(permissionId) || !code || !resource || !action) {
    return {
      ok: false,
      message: "Paramètres de permission invalides.",
    };
  }

  const permissionRows = await prisma.$queryRaw<
    Array<{ id: string; code: string }>
  >`
    SELECT "id"::text AS "id", "code"
    FROM public."Permission"
    WHERE "id" = ${permissionId}::uuid
    LIMIT 1
  `;
  const permission = permissionRows[0];
  if (!permission) {
    return {
      ok: false,
      message: "Permission introuvable.",
    };
  }

  if (PROTECTED_PERMISSION_CODES.has(permission.code) && code !== permission.code) {
    return {
      ok: false,
      message: "Le code de cette permission système ne peut pas être modifié.",
    };
  }

  const duplicateRows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT "id"::text AS "id"
    FROM public."Permission"
    WHERE "code" = ${code}
      AND "id" <> ${permissionId}::uuid
    LIMIT 1
  `;
  if (duplicateRows.length > 0) {
    return {
      ok: false,
      message: "Ce code de permission est déjà utilisé.",
    };
  }

  await prisma.$executeRaw`
    UPDATE public."Permission"
    SET
      "code" = ${code},
      "resource" = ${resource},
      "action" = ${action},
      "description" = ${description || null}
    WHERE "id" = ${permissionId}::uuid
  `;

  userLogger.info("Permission updated", {
    permissionId,
    oldCode: permission.code,
    newCode: code,
  });
  revalidateRbacPaths();

  return {
    ok: true,
    message: `Permission ${code} mise à jour.`,
  };
}

export async function deletePermissionAction(
  _prevState: RbacActionState,
  formData: FormData
): Promise<RbacActionState> {
  const actionLogger = await getServerActionLogger("dashboard.rbac.permission.delete");
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    return { ok: false, message: "Session invalide. Reconnectez-vous." };
  }

  const userLogger = actionLogger.child({ userId: session.user.id });
  const canManage = await userHasPermission(
    session.user.id,
    RBAC_PERMISSIONS.RBAC_ROLES_MANAGE
  );

  if (!canManage) {
    userLogger.warn("Delete permission rejected: missing permission");
    return {
      ok: false,
      message: "Accès refusé. Vous ne pouvez pas supprimer de permission.",
    };
  }

  const permissionId = getValue(formData, "permissionId");
  if (!isUuid(permissionId)) {
    return {
      ok: false,
      message: "Permission invalide.",
    };
  }

  const permissionRows = await prisma.$queryRaw<
    Array<{ id: string; code: string }>
  >`
    SELECT "id"::text AS "id", "code"
    FROM public."Permission"
    WHERE "id" = ${permissionId}::uuid
    LIMIT 1
  `;
  const permission = permissionRows[0];
  if (!permission) {
    return {
      ok: false,
      message: "Permission introuvable.",
    };
  }

  if (PROTECTED_PERMISSION_CODES.has(permission.code)) {
    return {
      ok: false,
      message: "Cette permission système ne peut pas être supprimée.",
    };
  }

  await prisma.$executeRaw`
    DELETE FROM public."Permission"
    WHERE "id" = ${permissionId}::uuid
  `;

  userLogger.info("Permission deleted", { permissionId, code: permission.code });
  revalidateRbacPaths();

  return {
    ok: true,
    message: `Permission ${permission.code} supprimée.`,
  };
}

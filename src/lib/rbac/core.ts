import "server-only";

import prisma from "@/src/lib/prisma";
import { RBAC_PERMISSIONS, type RbacPermissionCode } from "@/src/lib/rbac/permissions";

export type UserRbacSnapshot = {
  roleCodes: string[];
  permissionCodes: string[];
};

const MEMBER_FALLBACK_PERMISSIONS: string[] = [
  RBAC_PERMISSIONS.DASHBOARD_ACCESS,
  RBAC_PERMISSIONS.DASHBOARD_OVERVIEW_READ,
  RBAC_PERMISSIONS.DASHBOARD_PROJECTS_READ,
  RBAC_PERMISSIONS.DASHBOARD_PROJECTS_CREATE,
  RBAC_PERMISSIONS.DASHBOARD_PROJECTS_UPDATE_OWN,
  RBAC_PERMISSIONS.DASHBOARD_DOCUMENT_TEMPLATES_READ,
  RBAC_PERMISSIONS.DASHBOARD_DOCUMENT_TEMPLATES_CREATE,
  RBAC_PERMISSIONS.DASHBOARD_DOCUMENT_TEMPLATES_UPDATE_OWN,
  RBAC_PERMISSIONS.DASHBOARD_PROFILE_READ,
  RBAC_PERMISSIONS.DASHBOARD_PROFILE_UPDATE_OWN,
  RBAC_PERMISSIONS.DASHBOARD_NOTIFICATIONS_READ,
  RBAC_PERMISSIONS.DASHBOARD_NOTIFICATIONS_MANAGE_OWN,
];

function isMissingRbacSchemaError(error: unknown) {
  const reason = error instanceof Error ? error.message : String(error);
  return (
    /P2021|42P01|relation .* does not exist/i.test(reason) &&
    /UserRole|RolePermission|Permission|Role/i.test(reason)
  );
}

export async function getUserRbacSnapshot(userId: string): Promise<UserRbacSnapshot> {
  let rows: Array<{ roleCode: string; permissionCode: string | null }> = [];
  try {
    rows = await prisma.$queryRaw<
      Array<{ roleCode: string; permissionCode: string | null }>
    >`
      SELECT
        r."code" AS "roleCode",
        p."code" AS "permissionCode"
      FROM public."UserRole" ur
      JOIN public."Role" r
        ON r."id" = ur."roleId"
      LEFT JOIN public."RolePermission" rp
        ON rp."roleId" = r."id"
      LEFT JOIN public."Permission" p
        ON p."id" = rp."permissionId"
      WHERE ur."userId" = ${userId}::uuid
    `;
  } catch (error) {
    if (!isMissingRbacSchemaError(error)) {
      throw error;
    }

    return {
      roleCodes: ["member"],
      permissionCodes: [...MEMBER_FALLBACK_PERMISSIONS],
    };
  }

  const roleCodes = Array.from(new Set(rows.map((row) => row.roleCode))).sort();
  const permissionSet = new Set<string>();

  for (const row of rows) {
    if (row.permissionCode) {
      permissionSet.add(row.permissionCode);
    }
  }

  return {
    roleCodes,
    permissionCodes: Array.from(permissionSet).sort(),
  };
}

export async function userHasPermission(
  userId: string,
  permissionCode: RbacPermissionCode | string
): Promise<boolean> {
  const snapshot = await getUserRbacSnapshot(userId);
  return snapshot.permissionCodes.includes(permissionCode);
}

export async function userHasAnyPermission(
  userId: string,
  permissionCodes: Array<RbacPermissionCode | string>
): Promise<boolean> {
  if (permissionCodes.length === 0) {
    return true;
  }

  const snapshot = await getUserRbacSnapshot(userId);
  const permissionSet = new Set(snapshot.permissionCodes);
  return permissionCodes.some((permissionCode) => permissionSet.has(permissionCode));
}

export function hasPermissionInSnapshot(
  snapshot: UserRbacSnapshot,
  permissionCode: RbacPermissionCode
): boolean {
  return snapshot.permissionCodes.includes(permissionCode);
}

export function canAccessDashboard(snapshot: UserRbacSnapshot): boolean {
  return hasPermissionInSnapshot(snapshot, RBAC_PERMISSIONS.DASHBOARD_ACCESS);
}

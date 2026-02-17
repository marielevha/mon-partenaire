import "server-only";

import { Prisma } from "@prisma/client";
import prisma from "@/src/lib/prisma";

export type RoleRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
};

export type PermissionRow = {
  id: string;
  code: string;
  resource: string;
  action: string;
  description: string | null;
};

export type RolePermissionRow = {
  roleId: string;
  permissionId: string;
  permissionCode: string;
};

export type RoleAssignmentCountRow = {
  roleId: string;
  total: number;
};

export type UserRow = {
  id: string;
  email: string | null;
  fullName: string | null;
};

export type UserRoleRow = {
  id: string;
  userId: string;
  userEmail: string | null;
  userFullName: string | null;
  roleId: string;
  roleCode: string;
  roleName: string;
  assignedByUserId: string | null;
  createdAt: Date;
};

export type RbacManagementData = {
  isMissingSchema: boolean;
  roles: RoleRow[];
  permissions: PermissionRow[];
  rolePermissionRows: RolePermissionRow[];
  roleAssignmentCountRows: RoleAssignmentCountRow[];
  users: UserRow[];
  userRoleRows: UserRoleRow[];
};

function isMissingRbacSchemaError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
    return true;
  }

  const reason = error instanceof Error ? error.message : String(error);
  return (
    /42P01|relation .* does not exist|P2021/i.test(reason) &&
    /RolePermission|Permission|UserRole|Role/i.test(reason)
  );
}

export async function fetchRbacManagementData(
  options: {
    includeUserAssignments?: boolean;
  } = {}
): Promise<RbacManagementData> {
  const includeUserAssignments = options.includeUserAssignments ?? false;

  let roles: RoleRow[] = [];
  let permissions: PermissionRow[] = [];
  let rolePermissionRows: RolePermissionRow[] = [];
  let roleAssignmentCountRows: RoleAssignmentCountRow[] = [];
  let users: UserRow[] = [];
  let userRoleRows: UserRoleRow[] = [];

  try {
    const roleQueryResults = await Promise.all([
      prisma.$queryRaw<RoleRow[]>`
        SELECT
          "id"::text AS "id",
          "code",
          "name",
          "description",
          "isSystem"
        FROM public."Role"
        ORDER BY "isSystem" DESC, "name" ASC
      `,
      prisma.$queryRaw<PermissionRow[]>`
        SELECT
          "id"::text AS "id",
          "code",
          "resource",
          "action",
          "description"
        FROM public."Permission"
        ORDER BY "resource" ASC, "action" ASC
      `,
      prisma.$queryRaw<RolePermissionRow[]>`
        SELECT
          rp."roleId"::text AS "roleId",
          rp."permissionId"::text AS "permissionId",
          p."code" AS "permissionCode"
        FROM public."RolePermission" rp
        JOIN public."Permission" p ON p."id" = rp."permissionId"
      `,
      prisma.$queryRaw<RoleAssignmentCountRow[]>`
        SELECT
          "roleId"::text AS "roleId",
          COUNT(*)::int AS "total"
        FROM public."UserRole"
        GROUP BY "roleId"
      `,
    ]);

    [roles, permissions, rolePermissionRows, roleAssignmentCountRows] = roleQueryResults;

    if (includeUserAssignments) {
      const userRoleQueryResults = await Promise.all([
        prisma.$queryRaw<UserRow[]>`
          SELECT
            u."id"::text AS "id",
            u."email"::text AS "email",
            pr."full_name" AS "fullName"
          FROM auth.users u
          LEFT JOIN public.profiles pr ON pr."id" = u."id"
          ORDER BY COALESCE(pr."full_name", u."email") ASC
          LIMIT 1000
        `,
        prisma.$queryRaw<UserRoleRow[]>`
          SELECT
            ur."id"::text AS "id",
            ur."userId"::text AS "userId",
            au."email"::text AS "userEmail",
            pr."full_name" AS "userFullName",
            ur."roleId"::text AS "roleId",
            r."code" AS "roleCode",
            r."name" AS "roleName",
            ur."assignedByUserId"::text AS "assignedByUserId",
            ur."createdAt"
          FROM public."UserRole" ur
          JOIN public."Role" r ON r."id" = ur."roleId"
          LEFT JOIN auth.users au ON au."id" = ur."userId"
          LEFT JOIN public.profiles pr ON pr."id" = ur."userId"
          ORDER BY ur."createdAt" DESC
          LIMIT 2000
        `,
      ]);

      [users, userRoleRows] = userRoleQueryResults;
    }
  } catch (error) {
    if (!isMissingRbacSchemaError(error)) {
      throw error;
    }

    return {
      isMissingSchema: true,
      roles: [],
      permissions: [],
      rolePermissionRows: [],
      roleAssignmentCountRows: [],
      users: [],
      userRoleRows: [],
    };
  }

  return {
    isMissingSchema: false,
    roles,
    permissions,
    rolePermissionRows,
    roleAssignmentCountRows,
    users,
    userRoleRows,
  };
}

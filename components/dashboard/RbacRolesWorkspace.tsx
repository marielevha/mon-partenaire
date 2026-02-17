"use client";

import { useMemo, useState } from "react";
import { cn } from "@/components/ui/utils";
import { RbacRolePermissionsManager } from "@/components/dashboard/RbacRolePermissionsManager";
import { RbacRolesCrudManager } from "@/components/dashboard/RbacRolesCrudManager";

type RoleItem = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissionCount: number;
  assignmentCount: number;
  permissionCodes: string[];
};

type PermissionItem = {
  id: string;
  code: string;
  resource: string;
  action: string;
  description: string | null;
};

type RbacRolesWorkspaceProps = {
  roles: RoleItem[];
  permissions: PermissionItem[];
  canManage: boolean;
};

type WorkspaceTab = "roles" | "mapping";

const tabs: Array<{ id: WorkspaceTab; label: string }> = [
  { id: "roles", label: "Gestion des rôles" },
  { id: "mapping", label: "Matrice des permissions" },
];

export function RbacRolesWorkspace({ roles, permissions, canManage }: RbacRolesWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("roles");

  const stats = useMemo(() => {
    const systemRoles = roles.filter((role) => role.isSystem).length;
    const customRoles = roles.length - systemRoles;
    const totalAssignments = roles.reduce((total, role) => total + role.assignmentCount, 0);

    return {
      totalRoles: roles.length,
      systemRoles,
      customRoles,
      totalAssignments,
    };
  }, [roles]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="dashboard-panel-soft rounded-xl p-4">
          <p className="dashboard-faint text-xs uppercase tracking-[0.16em]">Rôles</p>
          <p className="mt-1 text-2xl font-semibold">{stats.totalRoles}</p>
        </div>
        <div className="dashboard-panel-soft rounded-xl p-4">
          <p className="dashboard-faint text-xs uppercase tracking-[0.16em]">Système</p>
          <p className="mt-1 text-2xl font-semibold">{stats.systemRoles}</p>
        </div>
        <div className="dashboard-panel-soft rounded-xl p-4">
          <p className="dashboard-faint text-xs uppercase tracking-[0.16em]">Personnalisés</p>
          <p className="mt-1 text-2xl font-semibold">{stats.customRoles}</p>
        </div>
        <div className="dashboard-panel-soft rounded-xl p-4">
          <p className="dashboard-faint text-xs uppercase tracking-[0.16em]">Affectations</p>
          <p className="mt-1 text-2xl font-semibold">{stats.totalAssignments}</p>
        </div>
      </div>

      <div className="dashboard-panel-soft flex flex-wrap gap-2 rounded-xl p-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "bg-accent text-white shadow-[0_8px_20px_-12px_rgba(99,102,241,0.85)]"
                : "dashboard-faint hover:bg-accent/10 hover:text-text-primary"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "roles" ? (
        <RbacRolesCrudManager roles={roles} canManage={canManage} />
      ) : (
        <RbacRolePermissionsManager roles={roles} permissions={permissions} canManage={canManage} />
      )}
    </div>
  );
}

export default RbacRolesWorkspace;

export const RBAC_PERMISSIONS = {
  DASHBOARD_ACCESS: "dashboard.access",
  DASHBOARD_OVERVIEW_READ: "dashboard.overview.read",
  DASHBOARD_PROJECTS_READ: "dashboard.projects.read",
  DASHBOARD_PROJECTS_CREATE: "dashboard.projects.create",
  DASHBOARD_PROJECTS_UPDATE_OWN: "dashboard.projects.update.own",
  DASHBOARD_PROJECTS_UPDATE_ANY: "dashboard.projects.update.any",
  DASHBOARD_DOCUMENT_TEMPLATES_READ: "dashboard.document_templates.read",
  DASHBOARD_DOCUMENT_TEMPLATES_CREATE: "dashboard.document_templates.create",
  DASHBOARD_DOCUMENT_TEMPLATES_UPDATE_OWN: "dashboard.document_templates.update.own",
  DASHBOARD_DOCUMENT_TEMPLATES_UPDATE_ANY: "dashboard.document_templates.update.any",
  DASHBOARD_PROFILE_READ: "dashboard.profile.read",
  DASHBOARD_PROFILE_UPDATE_OWN: "dashboard.profile.update.own",
  DASHBOARD_NOTIFICATIONS_READ: "dashboard.notifications.read",
  DASHBOARD_NOTIFICATIONS_MANAGE_OWN: "dashboard.notifications.manage.own",
  DASHBOARD_PILOTAGE_READ: "dashboard.pilotage.read",
  DASHBOARD_QUALITY_READ: "dashboard.quality.read",
  DASHBOARD_QUALITY_NOTIFY: "dashboard.quality.notify",
  DASHBOARD_LOGS_READ: "dashboard.logs.read",
  RBAC_ROLES_READ: "rbac.roles.read",
  RBAC_ROLES_MANAGE: "rbac.roles.manage",
  RBAC_USER_ROLES_READ: "rbac.user_roles.read",
  RBAC_USER_ROLES_MANAGE: "rbac.user_roles.manage",
} as const;

export type RbacPermissionCode =
  (typeof RBAC_PERMISSIONS)[keyof typeof RBAC_PERMISSIONS];

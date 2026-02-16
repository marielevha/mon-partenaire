import "server-only";

import { promises as fs } from "fs";
import path from "path";

export type DashboardNotificationType = "project_inconsistency";

export type DashboardNotification = {
  id: string;
  createdAt: string;
  readAt: string | null;
  userId: string;
  title: string;
  message: string;
  type: DashboardNotificationType;
  projectId?: string;
  metadata?: Record<string, unknown>;
  triggeredByUserId?: string;
};

const MAX_NOTIFICATIONS = 5000;

function getNotificationsFilePath() {
  return path.join(process.cwd(), ".data", "dashboard-notifications.json");
}

async function readNotificationsFile(): Promise<DashboardNotification[]> {
  const filePath = getNotificationsFilePath();

  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as DashboardNotification[];
  } catch {
    return [];
  }
}

async function writeNotificationsFile(notifications: DashboardNotification[]) {
  const filePath = getNotificationsFilePath();
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(notifications, null, 2), "utf-8");
}

export async function addDashboardNotification(
  input: Omit<DashboardNotification, "id" | "createdAt" | "readAt">
) {
  const existing = await readNotificationsFile();
  const next: DashboardNotification = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    readAt: null,
  };

  await writeNotificationsFile([next, ...existing].slice(0, MAX_NOTIFICATIONS));
  return next;
}

export async function listDashboardNotificationsForUser(
  userId: string,
  options?: {
    limit?: number;
    unreadOnly?: boolean;
  }
) {
  const { limit = 20, unreadOnly = false } = options ?? {};
  const all = await readNotificationsFile();

  const filtered = all.filter((item) => {
    if (item.userId !== userId) {
      return false;
    }
    if (unreadOnly && item.readAt !== null) {
      return false;
    }
    return true;
  });

  return filtered
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    )
    .slice(0, Math.max(1, limit));
}

export async function getDashboardUnreadNotificationsCount(userId: string) {
  const all = await readNotificationsFile();
  return all.filter((item) => item.userId === userId && item.readAt === null).length;
}

export async function markDashboardNotificationRead(
  userId: string,
  notificationId: string
) {
  const all = await readNotificationsFile();
  let hasUpdated = false;

  const updated = all.map((item) => {
    if (
      item.userId === userId &&
      item.id === notificationId &&
      item.readAt === null
    ) {
      hasUpdated = true;
      return {
        ...item,
        readAt: new Date().toISOString(),
      };
    }

    return item;
  });

  if (hasUpdated) {
    await writeNotificationsFile(updated);
  }

  return hasUpdated;
}

export async function markAllDashboardNotificationsRead(userId: string) {
  const all = await readNotificationsFile();
  let hasUpdated = false;

  const updated = all.map((item) => {
    if (item.userId === userId && item.readAt === null) {
      hasUpdated = true;
      return {
        ...item,
        readAt: new Date().toISOString(),
      };
    }

    return item;
  });

  if (hasUpdated) {
    await writeNotificationsFile(updated);
  }

  return hasUpdated;
}

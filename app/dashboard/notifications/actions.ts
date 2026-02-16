"use server";

import { revalidatePath } from "next/cache";
import {
  markAllDashboardNotificationsRead,
  markDashboardNotificationRead,
} from "@/src/lib/notifications/dashboard-notifications";
import { getServerActionLogger } from "@/src/lib/logging/server-action";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

function getValue(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

export async function markDashboardNotificationReadAction(formData: FormData) {
  const actionLogger = await getServerActionLogger("dashboard.notification.read");
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    actionLogger
      .child({ userId: "anonymous" })
      .warn("Mark notification read rejected: invalid session");
    return;
  }

  const notificationId = getValue(formData, "notificationId");
  if (!notificationId) {
    actionLogger
      .child({ userId: session.user.id })
      .warn("Mark notification read rejected: missing notificationId");
    return;
  }

  const updated = await markDashboardNotificationRead(session.user.id, notificationId);
  if (updated) {
    actionLogger
      .child({ userId: session.user.id })
      .info("Notification marked as read", { notificationId });
  }

  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/notifications");
}

export async function markAllDashboardNotificationsReadAction() {
  const actionLogger = await getServerActionLogger("dashboard.notification.read-all");
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    actionLogger
      .child({ userId: "anonymous" })
      .warn("Mark all notifications read rejected: invalid session");
    return;
  }

  const updated = await markAllDashboardNotificationsRead(session.user.id);
  if (updated) {
    actionLogger
      .child({ userId: session.user.id })
      .info("All notifications marked as read");
  }

  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/notifications");
}

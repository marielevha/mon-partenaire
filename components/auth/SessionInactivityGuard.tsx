"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/auth/actions";

type SessionInactivityGuardProps = {
  enabled: boolean;
  timeoutMinutes?: number;
};

const DEFAULT_TIMEOUT_MINUTES = 30;
const ACTIVITY_STORAGE_KEY = "mp:last-activity-at";
const ACTIVITY_WRITE_THROTTLE_MS = 15_000;
const IDLE_CHECK_INTERVAL_MS = 10_000;

function resolveTimeoutMs(timeoutMinutes?: number) {
  const minutes =
    typeof timeoutMinutes === "number" && Number.isFinite(timeoutMinutes) && timeoutMinutes > 0
      ? timeoutMinutes
      : DEFAULT_TIMEOUT_MINUTES;
  return minutes * 60_000;
}

export function SessionInactivityGuard({
  enabled,
  timeoutMinutes,
}: SessionInactivityGuardProps) {
  const pathname = usePathname();
  const isLoggingOutRef = useRef(false);
  const lastWriteAtRef = useRef(0);
  const timeoutMsRef = useRef(resolveTimeoutMs(timeoutMinutes));

  useEffect(() => {
    timeoutMsRef.current = resolveTimeoutMs(timeoutMinutes);
  }, [timeoutMinutes]);

  useEffect(() => {
    if (!enabled || isLoggingOutRef.current) {
      return;
    }

    const now = Date.now();
    const persisted = window.localStorage.getItem(ACTIVITY_STORAGE_KEY);
    const parsed = persisted ? Number.parseInt(persisted, 10) : Number.NaN;

    if (!Number.isFinite(parsed) || parsed <= 0) {
      window.localStorage.setItem(ACTIVITY_STORAGE_KEY, String(now));
      lastWriteAtRef.current = now;
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled || isLoggingOutRef.current) {
      return;
    }

    const markActivity = (force = false) => {
      if (isLoggingOutRef.current) {
        return;
      }

      const now = Date.now();
      if (!force && now - lastWriteAtRef.current < ACTIVITY_WRITE_THROTTLE_MS) {
        return;
      }

      lastWriteAtRef.current = now;
      window.localStorage.setItem(ACTIVITY_STORAGE_KEY, String(now));
    };

    const triggerLogout = async () => {
      if (isLoggingOutRef.current) {
        return;
      }
      isLoggingOutRef.current = true;

      try {
        await logoutAction();
      } catch {
        window.location.assign("/auth/login");
      }
    };

    const onActivity = () => markActivity(false);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        markActivity(true);
      }
    };

    markActivity(true);

    const intervalId = window.setInterval(() => {
      const raw = window.localStorage.getItem(ACTIVITY_STORAGE_KEY);
      const lastActivityAt = raw ? Number.parseInt(raw, 10) : 0;
      const safeLastActivityAt =
        Number.isFinite(lastActivityAt) && lastActivityAt > 0 ? lastActivityAt : Date.now();

      if (Date.now() - safeLastActivityAt >= timeoutMsRef.current) {
        void triggerLogout();
      }
    }, IDLE_CHECK_INTERVAL_MS);

    window.addEventListener("mousemove", onActivity, { passive: true });
    window.addEventListener("mousedown", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity);
    window.addEventListener("scroll", onActivity, { passive: true });
    window.addEventListener("touchstart", onActivity, { passive: true });
    window.addEventListener("focus", onActivity);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("mousemove", onActivity);
      window.removeEventListener("mousedown", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("scroll", onActivity);
      window.removeEventListener("touchstart", onActivity);
      window.removeEventListener("focus", onActivity);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || isLoggingOutRef.current) {
      return;
    }

    const now = Date.now();
    lastWriteAtRef.current = now;
    window.localStorage.setItem(ACTIVITY_STORAGE_KEY, String(now));
  }, [enabled, pathname]);

  return null;
}

export default SessionInactivityGuard;

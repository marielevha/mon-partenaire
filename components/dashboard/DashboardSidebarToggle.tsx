"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "dashboard_sidebar_collapsed";
const COLLAPSED_CLASS = "sidebar-collapsed";

type DashboardSidebarToggleProps = {
  shellId?: string;
};

export function DashboardSidebarToggle({
  shellId = "dashboard-shell-root",
}: DashboardSidebarToggleProps) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    function isEditableTarget(target: EventTarget | null) {
      if (!(target instanceof HTMLElement)) {
        return false;
      }

      const tagName = target.tagName.toLowerCase();
      return (
        target.isContentEditable ||
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select"
      );
    }

    function handleToggleShortcut(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey)) {
        return;
      }
      if (event.key.toLowerCase() !== "b") {
        return;
      }
      if (isEditableTarget(event.target)) {
        return;
      }

      event.preventDefault();
      setCollapsed((previous) => !previous);
    }

    document.addEventListener("keydown", handleToggleShortcut);
    return () => {
      document.removeEventListener("keydown", handleToggleShortcut);
    };
  }, []);

  useEffect(() => {
    let storedCollapsed = false;
    try {
      storedCollapsed = localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      storedCollapsed = false;
    }

    setCollapsed(storedCollapsed);
  }, []);

  useEffect(() => {
    const shell = document.getElementById(shellId);
    if (!shell) {
      return;
    }

    shell.classList.toggle(COLLAPSED_CLASS, collapsed);
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      // Ignore persistence errors (private mode, disabled storage, etc.)
    }
  }, [collapsed, shellId]);

  return (
    <button
      type="button"
      onClick={() => setCollapsed((previous) => !previous)}
      aria-label={collapsed ? "Déployer le menu" : "Réduire le menu"}
      title={collapsed ? "Déployer le menu" : "Réduire le menu"}
      className="dashboard-icon-btn hidden h-11 w-11 items-center justify-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45 xl:inline-flex"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        {collapsed ? <path d="m8 5 5 5-5 5" /> : <path d="m12 5-5 5 5 5" />}
      </svg>
    </button>
  );
}

export default DashboardSidebarToggle;

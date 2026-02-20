"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type LogsFiltersFormProps = {
  query: string;
  level: string;
  action: string;
  userId: string;
  from: string;
  to: string;
  availableLevels: string[];
  availableActions: string[];
};

type LogsPerPageControlProps = {
  pageSize: number;
  options: readonly number[];
};

export function LogsFiltersForm({
  query,
  level,
  action,
  userId,
  from,
  to,
  availableLevels,
  availableActions,
}: LogsFiltersFormProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [qValue, setQValue] = useState(query);
  const [levelValue, setLevelValue] = useState(level || "all");
  const [actionValue, setActionValue] = useState(action);
  const [userIdValue, setUserIdValue] = useState(userId);
  const [fromValue, setFromValue] = useState(from);
  const [toValue, setToValue] = useState(to);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQValue(query);
  }, [query]);

  useEffect(() => {
    setLevelValue(level || "all");
  }, [level]);

  useEffect(() => {
    setActionValue(action);
  }, [action]);

  useEffect(() => {
    setUserIdValue(userId);
  }, [userId]);

  useEffect(() => {
    setFromValue(from);
  }, [from]);

  useEffect(() => {
    setToValue(to);
  }, [to]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const applyFilters = (
    overrides: Partial<{
      q: string;
      level: string;
      action: string;
      userId: string;
      from: string;
      to: string;
    }>,
    debounceMs = 0
  ) => {
    const run = () => {
      const params = new URLSearchParams(window.location.search);

      const nextQuery = overrides.q ?? qValue;
      const nextLevel = overrides.level ?? levelValue;
      const nextAction = overrides.action ?? actionValue;
      const nextUser = overrides.userId ?? userIdValue;
      const nextFrom = overrides.from ?? fromValue;
      const nextTo = overrides.to ?? toValue;

      if (nextQuery.trim()) params.set("q", nextQuery.trim());
      else params.delete("q");
      if (nextLevel && nextLevel !== "all") params.set("level", nextLevel);
      else params.delete("level");
      if (nextAction) params.set("action", nextAction);
      else params.delete("action");
      if (nextUser.trim()) params.set("userId", nextUser.trim());
      else params.delete("userId");
      if (nextFrom) params.set("from", nextFrom);
      else params.delete("from");
      if (nextTo) params.set("to", nextTo);
      else params.delete("to");

      params.set("page", "1");
      router.replace(`${pathname}?${params.toString()}`);
    };

    if (debounceMs > 0) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(run, debounceMs);
      return;
    }

    run();
  };

  const handleTextFilterChange = (field: "q" | "userId", value: string) => {
    if (field === "q") {
      setQValue(value);
      applyFilters({ q: value }, 350);
      return;
    }

    setUserIdValue(value);
    applyFilters({ userId: value }, 350);
  };

  const handleImmediateChange = (
    field: "level" | "action" | "from" | "to",
    value: string
  ) => {
    if (field === "level") {
      setLevelValue(value);
      applyFilters({ level: value });
      return;
    }
    if (field === "action") {
      setActionValue(value);
      applyFilters({ action: value });
      return;
    }
    if (field === "from") {
      setFromValue(value);
      applyFilters({ from: value });
      return;
    }

    setToValue(value);
    applyFilters({ to: value });
  };

  return (
    <div className="dashboard-panel rounded-2xl p-5">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-1.5">
          <span className="dashboard-faint text-xs uppercase tracking-wide">Recherche</span>
          <input
            value={qValue}
            onChange={(event) => handleTextFilterChange("q", event.target.value)}
            placeholder="message, action, requestId, userId"
            className="dashboard-input h-10 w-full rounded-lg px-3 text-sm"
          />
        </label>

        <label className="space-y-1.5">
          <span className="dashboard-faint text-xs uppercase tracking-wide">Niveau</span>
          <select
            value={levelValue}
            onChange={(event) => handleImmediateChange("level", event.target.value)}
            className="dashboard-input h-10 w-full rounded-lg px-3 text-sm"
          >
            <option value="all">Tous</option>
            {availableLevels.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="dashboard-faint text-xs uppercase tracking-wide">Action</span>
          <select
            value={actionValue}
            onChange={(event) => handleImmediateChange("action", event.target.value)}
            className="dashboard-input h-10 w-full rounded-lg px-3 text-sm"
          >
            <option value="">Toutes</option>
            {availableActions.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="dashboard-faint text-xs uppercase tracking-wide">User ID</span>
          <input
            value={userIdValue}
            onChange={(event) => handleTextFilterChange("userId", event.target.value)}
            placeholder="UUID ou anonymous"
            className="dashboard-input h-10 w-full rounded-lg px-3 text-sm"
          />
        </label>

        <label className="space-y-1.5">
          <span className="dashboard-faint text-xs uppercase tracking-wide">Du</span>
          <input
            type="date"
            value={fromValue}
            onChange={(event) => handleImmediateChange("from", event.target.value)}
            className="dashboard-input h-10 w-full rounded-lg px-3 text-sm"
          />
        </label>

        <label className="space-y-1.5">
          <span className="dashboard-faint text-xs uppercase tracking-wide">Au</span>
          <input
            type="date"
            value={toValue}
            onChange={(event) => handleImmediateChange("to", event.target.value)}
            className="dashboard-input h-10 w-full rounded-lg px-3 text-sm"
          />
        </label>

        <div className="flex items-end">
          <Link
            href="/dashboard/logs"
            className="dashboard-btn-secondary inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold transition-colors"
          >
            Réinitialiser
          </Link>
        </div>
      </div>
    </div>
  );
}

export function LogsPerPageControl({ pageSize, options }: LogsPerPageControlProps) {
  const router = useRouter();
  const pathname = usePathname();

  const onChange = (value: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set("pageSize", value);
    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <label className="flex items-center gap-2">
      <span className="dashboard-faint text-sm">Par page</span>
      <select
        value={String(pageSize)}
        onChange={(event) => onChange(event.target.value)}
        className="dashboard-input h-9 rounded-md px-3 text-sm"
      >
        {options.map((entry) => (
          <option key={entry} value={entry}>
            {entry}
          </option>
        ))}
      </select>
    </label>
  );
}

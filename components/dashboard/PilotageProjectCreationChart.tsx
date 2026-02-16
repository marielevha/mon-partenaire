"use client";

import { useRef, useState } from "react";
import { PilotageLineChart } from "@/components/dashboard/PilotageLineChart";

type SeriesPoint = {
  label: string;
  value: number;
};

type PilotageProjectCreationChartProps = {
  initialPoints: SeriesPoint[];
  initialMonths?: 3 | 6 | 9 | 12;
};

const MONTH_OPTIONS = [3, 6, 9, 12] as const;

export function PilotageProjectCreationChart({
  initialPoints,
  initialMonths = 6,
}: PilotageProjectCreationChartProps) {
  const [months, setMonths] = useState<(typeof MONTH_OPTIONS)[number]>(initialMonths);
  const [points, setPoints] = useState<SeriesPoint[]>(initialPoints);
  const [isLoading, setIsLoading] = useState(false);
  const requestCounterRef = useRef(0);

  const handleMonthChange = async (nextValueRaw: string) => {
    const nextValue = Number.parseInt(nextValueRaw, 10);
    const nextMonths = MONTH_OPTIONS.includes(nextValue as (typeof MONTH_OPTIONS)[number])
      ? (nextValue as (typeof MONTH_OPTIONS)[number])
      : 6;

    setMonths(nextMonths);
    setIsLoading(true);

    const requestId = requestCounterRef.current + 1;
    requestCounterRef.current = requestId;

    try {
      const response = await fetch(
        `/api/dashboard/pilotage/project-creation?months=${nextMonths}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as {
        ok?: boolean;
        points?: SeriesPoint[];
      };

      if (requestCounterRef.current !== requestId) {
        return;
      }

      if (payload.ok && Array.isArray(payload.points)) {
        setPoints(payload.points);
      }
    } finally {
      if (requestCounterRef.current === requestId) {
        setIsLoading(false);
      }
    }
  };

  return (
    <PilotageLineChart
      title={`Création de projets (${months} derniers mois)`}
      points={points}
      controls={
        <div className="flex items-center gap-2">
          <label className="dashboard-faint text-[11px] uppercase tracking-wide" htmlFor="pilotage-months">
            Période
          </label>
          <select
            id="pilotage-months"
            name="months"
            value={String(months)}
            onChange={(event) => {
              void handleMonthChange(event.target.value);
            }}
            className="dashboard-input h-8 rounded-md px-2 text-xs"
            disabled={isLoading}
          >
            {MONTH_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value} mois
              </option>
            ))}
          </select>
          {isLoading ? (
            <span className="dashboard-faint text-[11px]">Mise à jour...</span>
          ) : null}
        </div>
      }
    />
  );
}

export default PilotageProjectCreationChart;

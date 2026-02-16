"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

type DoughnutItem = {
  label: string;
  count: number;
  color: string;
};

type LogsLevelDoughnutChartProps = {
  items: DoughnutItem[];
};

type ChartLike = {
  destroy: () => void;
};

declare global {
  interface Window {
    Chart?: {
      new (ctx: CanvasRenderingContext2D, config: unknown): ChartLike;
    };
  }
}

function cssVar(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

export function LogsLevelDoughnutChart({ items }: LogsLevelDoughnutChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<ChartLike | null>(null);
  const [isChartReady, setIsChartReady] = useState(false);
  const [themeVersion, setThemeVersion] = useState(0);

  const entries = items.filter((item) => item.count > 0);

  useEffect(() => {
    if (window.Chart) {
      setIsChartReady(true);
    }
  }, []);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setThemeVersion((value) => value + 1);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isChartReady || !window.Chart || !canvasRef.current) return;
    const context = canvasRef.current.getContext("2d");
    if (!context) return;

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    const textMuted = cssVar("--dashboard-text-muted", "#94a3b8");
    const border = cssVar("--dashboard-border", "rgba(148,163,184,.35)");

    chartRef.current = new window.Chart(context, {
      type: "doughnut",
      data: {
        labels: entries.map((entry) => entry.label),
        datasets: [
          {
            data: entries.map((entry) => entry.count),
            backgroundColor: entries.map((entry) => entry.color),
            borderColor: border,
            borderWidth: 1,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "68%",
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: "rgba(10, 16, 32, 0.95)",
            borderColor: border,
            borderWidth: 1,
            titleColor: "#f8fafc",
            bodyColor: "#cbd5e1",
            padding: 10,
            callbacks: {
              label: (ctx: { label?: string; parsed: number }) =>
                `${ctx.label ?? "Niveau"}: ${ctx.parsed}`,
            },
          },
        },
      },
    } as const);

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [entries, isChartReady, themeVersion]);

  if (entries.length === 0) {
    return (
      <p className="dashboard-faint rounded-lg border border-dashed px-3 py-2 text-sm">
        Pas de données disponibles.
      </p>
    );
  }

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"
        strategy="afterInteractive"
        onLoad={() => setIsChartReady(true)}
        onReady={() => setIsChartReady(true)}
      />
      <div className="relative h-56 w-full">
        <canvas ref={canvasRef} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        {entries.map((entry) => (
          <div key={entry.label} className="dashboard-panel-soft flex items-center justify-between rounded-md px-2 py-1.5">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
                aria-hidden="true"
              />
              <span className="dashboard-faint truncate uppercase">{entry.label}</span>
            </span>
            <span className="font-semibold">{entry.count}</span>
          </div>
        ))}
      </div>
    </>
  );
}

export default LogsLevelDoughnutChart;


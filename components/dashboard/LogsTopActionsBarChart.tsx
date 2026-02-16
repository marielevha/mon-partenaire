"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

type TopActionItem = {
  action: string;
  count: number;
};

type LogsTopActionsBarChartProps = {
  items: TopActionItem[];
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

export function LogsTopActionsBarChart({ items }: LogsTopActionsBarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<ChartLike | null>(null);
  const [isChartReady, setIsChartReady] = useState(false);
  const [themeVersion, setThemeVersion] = useState(0);

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

    const accent = cssVar("--accent", "#6d5efc");
    const textMuted = cssVar("--dashboard-text-muted", "#94a3b8");
    const border = cssVar("--dashboard-border", "rgba(148,163,184,.35)");

    chartRef.current = new window.Chart(context, {
      type: "bar",
      data: {
        labels: items.map((item) => item.action),
        datasets: [
          {
            data: items.map((item) => item.count),
            backgroundColor: accent,
            borderRadius: 6,
            maxBarThickness: 16,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
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
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              color: textMuted,
              precision: 0,
              font: {
                size: 11,
              },
            },
            grid: {
              color: border,
              borderDash: [4, 4],
            },
          },
          y: {
            ticks: {
              color: textMuted,
              font: {
                size: 11,
              },
              callback: function (value: number | string) {
                const raw = String(value);
                const idx = Number.parseInt(raw, 10);
                const label = Number.isFinite(idx) ? items[idx]?.action : raw;
                return label && label.length > 32 ? `${label.slice(0, 32)}...` : label || raw;
              },
            },
            grid: {
              display: false,
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
  }, [isChartReady, items, themeVersion]);

  if (items.length === 0) {
    return (
      <p className="dashboard-faint rounded-lg border border-dashed px-3 py-2 text-sm">
        Aucune action trouvée pour ces filtres.
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
      <div className="relative h-64 w-full">
        <canvas ref={canvasRef} />
      </div>
    </>
  );
}

export default LogsTopActionsBarChart;


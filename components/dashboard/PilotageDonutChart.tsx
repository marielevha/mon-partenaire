"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

type PilotageDonutItem = {
  label: string;
  value: number;
  color: string;
};

type PilotageDonutChartProps = {
  title: string;
  items: PilotageDonutItem[];
  totalLabel?: string;
  variant?: "doughnut" | "pie";
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

export function PilotageDonutChart({
  title,
  items,
  totalLabel = "total",
  variant = "doughnut",
}: PilotageDonutChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<ChartLike | null>(null);
  const [isChartReady, setIsChartReady] = useState(false);
  const [themeVersion, setThemeVersion] = useState(0);

  const sanitizedItems = items.filter((item) => item.value > 0);
  const total = sanitizedItems.reduce((sum, item) => sum + item.value, 0);

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
      type: variant,
      data: {
        labels: sanitizedItems.map((item) => item.label),
        datasets: [
          {
            data: sanitizedItems.map((item) => item.value),
            backgroundColor: sanitizedItems.map((item) => item.color),
            borderColor: border,
            borderWidth: 1,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: variant === "doughnut" ? "67%" : undefined,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(10, 16, 32, 0.95)",
            borderColor: border,
            borderWidth: 1,
            titleColor: "#f8fafc",
            bodyColor: "#cbd5e1",
            padding: 10,
            displayColors: false,
            callbacks: {
              label: (ctx: { label?: string; parsed: number }) =>
                `${ctx.label ?? "Entrée"}: ${ctx.parsed}`,
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
  }, [isChartReady, sanitizedItems, variant, themeVersion]);

  const chartItems = sanitizedItems.length > 0 ? sanitizedItems : items;

  return (
    <div className="dashboard-panel flex h-full min-h-[320px] flex-col overflow-hidden rounded-2xl p-5">
      <h3 className="min-h-[3rem] text-sm font-semibold leading-6">{title}</h3>
      {chartItems.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-border/60 px-3 py-2 text-sm text-slate-400">
          Aucune donnée disponible.
        </div>
      ) : (
        <>
          <Script
            src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"
            strategy="afterInteractive"
            onLoad={() => setIsChartReady(true)}
            onReady={() => setIsChartReady(true)}
          />
          <div className="relative mx-auto mt-3 h-44 w-full max-w-[220px]">
            <canvas ref={canvasRef} />
            {variant === "doughnut" ? (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-semibold">{total}</span>
                <span className="text-[11px] uppercase tracking-wide text-slate-400">
                  {totalLabel}
                </span>
              </div>
            ) : null}
          </div>
          <div className="mt-4 space-y-2.5 text-sm">
            {chartItems.map((item) => {
              const ratio = total > 0 ? Math.round((item.value / total) * 100) : 0;
              return (
                <div key={item.label} className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                      aria-hidden="true"
                    />
                    <span className="dashboard-faint truncate">{item.label}</span>
                  </span>
                  <span className="shrink-0 whitespace-nowrap font-semibold">
                    {item.value} <span className="dashboard-faint">({ratio}%)</span>
                  </span>
                </div>
              );
            })}
            {variant === "pie" ? (
              <p className="dashboard-faint mt-1 text-xs uppercase tracking-wide">
                {totalLabel}: {total}
              </p>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

export default PilotageDonutChart;


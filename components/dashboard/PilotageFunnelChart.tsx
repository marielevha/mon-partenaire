"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

type FunnelStep = {
  label: string;
  value: number;
};

type PilotageFunnelChartProps = {
  title: string;
  steps: FunnelStep[];
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

export function PilotageFunnelChart({ title, steps }: PilotageFunnelChartProps) {
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
    if (!isChartReady || !window.Chart || !canvasRef.current || steps.length === 0) return;
    const context = canvasRef.current.getContext("2d");
    if (!context) return;

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    const accent = cssVar("--accent", "#6d5efc");
    const accentSecondary = cssVar("--accent-secondary", "#8b7bff");
    const textMuted = cssVar("--dashboard-text-muted", "#94a3b8");
    const border = cssVar("--dashboard-border", "rgba(148,163,184,.35)");

    const labels = steps.map((step, index) => `${index + 1}. ${step.label}`);

    chartRef.current = new window.Chart(context, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Utilisateurs",
            data: steps.map((step) => step.value),
            backgroundColor: [accent, accentSecondary, "#6366f1", "#475569"],
            borderRadius: 8,
            maxBarThickness: 18,
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
            callbacks: {
              label: (ctx: { parsed: { x: number } }) => `${ctx.parsed.x} utilisateurs`,
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              precision: 0,
              color: textMuted,
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
  }, [isChartReady, steps, themeVersion]);

  const firstStepValue = steps[0]?.value ?? 0;

  return (
    <div className="dashboard-panel rounded-2xl p-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      {steps.length === 0 ? (
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
          <div className="mt-4 h-56 w-full">
            <canvas ref={canvasRef} />
          </div>
          <div className="mt-3 space-y-1.5 text-xs">
            {steps.map((step, index) => {
              const ratio =
                firstStepValue > 0 ? Math.round((step.value / firstStepValue) * 100) : 0;
              return (
                <div key={step.label} className="flex items-center justify-between gap-2">
                  <span className="dashboard-faint truncate">
                    {index + 1}. {step.label}
                  </span>
                  <span className="font-semibold">
                    {step.value} <span className="dashboard-faint">({ratio}%)</span>
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default PilotageFunnelChart;


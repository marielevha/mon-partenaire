"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import Script from "next/script";

type PilotageLinePoint = {
  label: string;
  value: number;
};

type PilotageLineChartProps = {
  title: string;
  points: PilotageLinePoint[];
  controls?: ReactNode;
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

export function PilotageLineChart({ title, points, controls }: PilotageLineChartProps) {
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
    if (!isChartReady || !window.Chart || !canvasRef.current || points.length === 0) return;
    const context = canvasRef.current.getContext("2d");
    if (!context) return;

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    const accent = cssVar("--accent", "#6d5efc");
    const textMuted = cssVar("--dashboard-text-muted", "#94a3b8");
    const border = cssVar("--dashboard-border", "rgba(148,163,184,.35)");

    const gradient = context.createLinearGradient(0, 0, 0, 260);
    gradient.addColorStop(0, "rgba(109, 94, 252, 0.3)");
    gradient.addColorStop(1, "rgba(109, 94, 252, 0.05)");

    chartRef.current = new window.Chart(context, {
      type: "line",
      data: {
        labels: points.map((point) => point.label),
        datasets: [
          {
            data: points.map((point) => point.value),
            borderColor: accent,
            backgroundColor: gradient,
            fill: true,
            borderWidth: 2.5,
            pointRadius: 2.5,
            pointHoverRadius: 4,
            pointBackgroundColor: accent,
            pointBorderWidth: 0,
            tension: 0.35,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: "index",
        },
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
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: textMuted,
              maxRotation: 0,
              minRotation: 0,
              font: { size: 11 },
            },
          },
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
              color: textMuted,
              font: { size: 11 },
            },
            grid: {
              color: border,
              borderDash: [4, 4],
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
  }, [isChartReady, points, themeVersion]);

  return (
    <div className="dashboard-panel flex h-full min-h-[320px] flex-col overflow-hidden rounded-2xl p-5">
      <div className="flex min-h-[3rem] items-start justify-between gap-3">
        <h3 className="text-sm font-semibold leading-6">{title}</h3>
        {controls ? <div className="shrink-0">{controls}</div> : null}
      </div>
      {points.length === 0 ? (
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
          <div className="mt-4 h-52 w-full">
            <canvas ref={canvasRef} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-text-secondary sm:grid-cols-6">
            {points.map((point, index) => (
              <div
                key={`${point.label}-${index}`}
                className="truncate rounded-md border border-border/50 bg-background/30 px-2 py-1 text-center"
              >
                {point.label}: {point.value}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default PilotageLineChart;

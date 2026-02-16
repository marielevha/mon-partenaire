"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

type TimelinePoint = {
  label: string;
  count: number;
};

type LogsTimelineChartProps = {
  points: TimelinePoint[];
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

export function LogsTimelineChart({ points }: LogsTimelineChartProps) {
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

    const gradient = context.createLinearGradient(0, 0, 0, 260);
    gradient.addColorStop(0, "rgba(109, 94, 252, 0.28)");
    gradient.addColorStop(1, "rgba(109, 94, 252, 0.04)");

    chartRef.current = new window.Chart(context, {
      type: "line",
      data: {
        labels: points.map((point) => point.label),
        datasets: [
          {
            label: "Logs",
            data: points.map((point) => point.count),
            borderColor: accent,
            backgroundColor: gradient,
            fill: true,
            borderWidth: 2.5,
            pointRadius: 2.2,
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
            displayColors: false,
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: textMuted,
              autoSkip: true,
              maxTicksLimit: 8,
              maxRotation: 0,
              minRotation: 0,
              font: {
                size: 11,
              },
            },
          },
          y: {
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
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"
        strategy="afterInteractive"
        onLoad={() => setIsChartReady(true)}
        onReady={() => setIsChartReady(true)}
      />
      <div className="relative h-full min-h-[220px] w-full">
        <canvas ref={canvasRef} />
      </div>
    </>
  );
}

export default LogsTimelineChart;

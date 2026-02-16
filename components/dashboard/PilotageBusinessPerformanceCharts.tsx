"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

type PilotageBusinessPerformanceChartsProps = {
  totalCapitalSought: number;
  ownerContributionTotal: number;
  financialAmountFilled: number;
  publicationRate: number;
  draftToPublishedRate: number;
  capitalCoverage: number;
  needsFillRate: number;
  ownerActivationRate: number;
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

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function PilotageBusinessPerformanceCharts({
  totalCapitalSought,
  ownerContributionTotal,
  financialAmountFilled,
  publicationRate,
  draftToPublishedRate,
  capitalCoverage,
  needsFillRate,
  ownerActivationRate,
}: PilotageBusinessPerformanceChartsProps) {
  const capitalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const ratiosCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const capitalChartRef = useRef<ChartLike | null>(null);
  const ratiosChartRef = useRef<ChartLike | null>(null);
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
    if (!isChartReady || !window.Chart) return;

    const border = cssVar("--dashboard-border", "rgba(148,163,184,.35)");
    const textMuted = cssVar("--dashboard-text-muted", "#94a3b8");
    const accent = cssVar("--accent", "#6d5efc");
    const accentSecondary = cssVar("--accent-secondary", "#8b7bff");

    const capitalCtx = capitalCanvasRef.current?.getContext("2d");
    const ratiosCtx = ratiosCanvasRef.current?.getContext("2d");
    if (!capitalCtx || !ratiosCtx) return;

    if (capitalChartRef.current) {
      capitalChartRef.current.destroy();
      capitalChartRef.current = null;
    }
    if (ratiosChartRef.current) {
      ratiosChartRef.current.destroy();
      ratiosChartRef.current = null;
    }

    const remainder = Math.max(
      0,
      Math.round(totalCapitalSought - (ownerContributionTotal + financialAmountFilled))
    );

    capitalChartRef.current = new window.Chart(capitalCtx, {
      type: "bar",
      data: {
        labels: [
          "Capital visé",
          "Apport fondateur",
          "Financement externe",
          "Reste à couvrir",
        ],
        datasets: [
          {
            data: [
              Math.max(0, Math.round(totalCapitalSought)),
              Math.max(0, Math.round(ownerContributionTotal)),
              Math.max(0, Math.round(financialAmountFilled)),
              remainder,
            ],
            backgroundColor: [accentSecondary, "#06b6d4", "#10b981", "#f59e0b"],
            borderRadius: 7,
            maxBarThickness: 28,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(10, 16, 32, 0.95)",
            borderColor: border,
            borderWidth: 1,
            titleColor: "#f8fafc",
            bodyColor: "#cbd5e1",
            padding: 10,
            callbacks: {
              label: (ctx: { parsed: { y: number } }) =>
                `${Math.round(ctx.parsed.y).toLocaleString("fr-FR")} FCFA`,
            },
          },
        },
        scales: {
          x: {
            ticks: {
              color: textMuted,
              maxRotation: 0,
              minRotation: 0,
              font: { size: 11 },
            },
            grid: { display: false },
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: textMuted,
              font: { size: 11 },
              callback: (value: number | string) => {
                const parsed = Number(value);
                return Number.isFinite(parsed)
                  ? `${Math.round(parsed).toLocaleString("fr-FR")}`
                  : String(value);
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

    ratiosChartRef.current = new window.Chart(ratiosCtx, {
      type: "radar",
      data: {
        labels: [
          "Taux publication",
          "Conv. brouillon→publié",
          "Couverture capital",
          "Besoins comblés",
          "Activation",
        ],
        datasets: [
          {
            label: "Performance (%)",
            data: [
              clampPercent(publicationRate),
              clampPercent(draftToPublishedRate),
              clampPercent(capitalCoverage),
              clampPercent(needsFillRate),
              clampPercent(ownerActivationRate),
            ],
            borderColor: accent,
            backgroundColor: "rgba(109, 94, 252, 0.22)",
            pointBackgroundColor: accent,
            pointBorderWidth: 0,
            borderWidth: 2,
            pointRadius: 2.5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(10, 16, 32, 0.95)",
            borderColor: border,
            borderWidth: 1,
            titleColor: "#f8fafc",
            bodyColor: "#cbd5e1",
            padding: 10,
            callbacks: {
              label: (ctx: { parsed: { r: number } }) => `${Math.round(ctx.parsed.r)}%`,
            },
          },
        },
        scales: {
          r: {
            beginAtZero: true,
            min: 0,
            max: 100,
            ticks: {
              color: textMuted,
              stepSize: 20,
              backdropColor: "transparent",
              showLabelBackdrop: false,
              font: { size: 10 },
            },
            angleLines: { color: border },
            grid: { color: border },
            pointLabels: {
              color: textMuted,
              font: { size: 10 },
            },
          },
        },
      },
    } as const);

    return () => {
      if (capitalChartRef.current) {
        capitalChartRef.current.destroy();
        capitalChartRef.current = null;
      }
      if (ratiosChartRef.current) {
        ratiosChartRef.current.destroy();
        ratiosChartRef.current = null;
      }
    };
  }, [
    isChartReady,
    totalCapitalSought,
    ownerContributionTotal,
    financialAmountFilled,
    publicationRate,
    draftToPublishedRate,
    capitalCoverage,
    needsFillRate,
    ownerActivationRate,
    themeVersion,
  ]);

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"
        strategy="afterInteractive"
        onLoad={() => setIsChartReady(true)}
        onReady={() => setIsChartReady(true)}
      />

      <div className="grid grid-cols-1 gap-3">
        <div className="dashboard-panel-soft rounded-xl p-3">
          <p className="dashboard-faint mb-2 text-xs uppercase tracking-wide">
            Structure du capital (FCFA)
          </p>
          <div className="h-56 w-full">
            <canvas ref={capitalCanvasRef} />
          </div>
        </div>
        <div className="dashboard-panel-soft rounded-xl p-3">
          <p className="dashboard-faint mb-2 text-xs uppercase tracking-wide">
            Ratios de performance (%)
          </p>
          <div className="h-56 w-full">
            <canvas ref={ratiosCanvasRef} />
          </div>
        </div>
      </div>
    </>
  );
}

export default PilotageBusinessPerformanceCharts;

import { NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

const ALLOWED_MONTHS = [3, 6, 9, 12] as const;
const DEFAULT_MONTHS = 6;

type SeriesPoint = {
  label: string;
  value: number;
};

function buildMonthSeries(rows: Array<{ bucket: string; count: number }>, months: number) {
  const result: SeriesPoint[] = [];
  const now = new Date();
  const monthMap = new Map(rows.map((row) => [row.bucket, row.count]));

  for (let i = months - 1; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = date.toLocaleDateString("fr-FR", { month: "short" });
    result.push({ label, value: monthMap.get(key) ?? 0 });
  }

  return result;
}

async function getProjectsCreatedByMonth(months = DEFAULT_MONTHS) {
  const lookbackMonths = Math.max(1, months - 1);
  const rows = await prisma.$queryRaw<Array<{ bucket: string; count: number }>>`
    SELECT
      to_char(date_trunc('month', "createdAt"), 'YYYY-MM') AS bucket,
      COUNT(*)::int AS count
    FROM "Project"
    WHERE "createdAt" >= date_trunc('month', NOW()) - (${lookbackMonths} * INTERVAL '1 month')
    GROUP BY 1
    ORDER BY 1
  `;

  return buildMonthSeries(rows, months);
}

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const monthsParam = Number.parseInt(url.searchParams.get("months") ?? "", 10);
  const selectedMonths = ALLOWED_MONTHS.includes(monthsParam as (typeof ALLOWED_MONTHS)[number])
    ? monthsParam
    : DEFAULT_MONTHS;

  const points = await getProjectsCreatedByMonth(selectedMonths);

  return NextResponse.json({
    ok: true,
    months: selectedMonths,
    points,
  });
}

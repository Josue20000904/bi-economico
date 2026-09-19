"use client";

import {
  BadgeDollarSign,
  ChartColumnIncreasing,
  CircleDollarSign,
  Percent,
} from "lucide-react";

import { HistoricalChartContent } from "@/components/charts/HistoricalChart";
import { KpiCard } from "@/components/ui/KpiCard";
import { companyOptionsBySegment } from "@/data/dashboardOptions";
import type { HistoricalPoint } from "@/data/historicalData";
import { useDashboardHistoricalData } from "@/hooks/useDashboardHistoricalData";
import type { DashboardFiltersState } from "@/types/dashboard";

type OverviewPanelProps = {
  filters: DashboardFiltersState;
};

type KpiMetric = "receita" | "ebitda" | "lucro" | "margem";

type SummaryPoint = {
  label: string;
  receita: number;
  ebitda: number;
  lucro: number;
  margem: number;
};

const metrics = [
  { key: "receita", title: "Receita líquida", icon: BadgeDollarSign },
  { key: "ebitda", title: "EBITDA", icon: ChartColumnIncreasing },
  { key: "lucro", title: "Lucro líquido", icon: CircleDollarSign },
  { key: "margem", title: "Margem EBITDA", icon: Percent },
] as const;

function formatValue(value: number, metric: KpiMetric) {
  const formatted = value.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  return metric === "margem" ? `${formatted}%` : `R$ ${formatted} bi`;
}

function summarize(
  history: HistoricalPoint[],
  frequency: DashboardFiltersState["frequency"],
): SummaryPoint[] {
  if (frequency === "trimestral") {
    return history.map((point) => ({
      label: point.label,
      receita: point.receita,
      ebitda: point.ebitda,
      lucro: point.lucro,
      margem: point.margem,
    }));
  }

  const byYear = new Map<number, HistoricalPoint[]>();
  for (const point of history) {
    const points = byYear.get(point.year) ?? [];
    points.push(point);
    byYear.set(point.year, points);
  }

  return Array.from(byYear.entries()).map(([year, points]) => ({
    label: String(year),
    receita: points.reduce((sum, point) => sum + point.receita, 0),
    ebitda: points.reduce((sum, point) => sum + point.ebitda, 0),
    lucro: points.reduce((sum, point) => sum + point.lucro, 0),
    // Mantém a margem simulada separada da receita real da CVM.
    margem:
      points.reduce((sum, point) => sum + point.margem, 0) /
      points.length,
  }));
}

export function OverviewPanel({ filters }: OverviewPanelProps) {
  const dashboardData = useDashboardHistoricalData(filters);
  const { historicalData, realCompanyMetrics } = dashboardData;

  const companyLabel =
    companyOptionsBySegment[filters.segment]?.find(
      (company) => company.value === filters.company,
    )?.label ?? filters.company;

  const periodLabel =
    filters.startYear === filters.endYear
      ? filters.startYear
      : `${filters.startYear} a ${filters.endYear}`;

  const startYear = Number(filters.startYear);
  const endYear = Number(filters.endYear);
  const series = summarize(
    historicalData.filter((point) => point.year <= endYear),
    filters.frequency,
  );
  const displayed = series.filter((point) => {
    const year = Number(point.label.slice(-4));
    return year >= startYear && year <= endYear;
  });

  const current = displayed.at(-1);
  const previousIndex = current
    ? series.findIndex((point) => point.label === current.label) - 1
    : -1;
  const previous = previousIndex >= 0 ? series[previousIndex] : undefined;

  return (
    <section>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">
            Visão geral
          </p>
          <h3 className="mt-2 text-xl font-semibold text-white">
            {companyLabel}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Indicadores selecionados para o período de {periodLabel}.
            {current ? ` Último período: ${current.label}.` : ""}
          </p>
        </div>

        <span className="self-start rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs text-amber-300 sm:self-auto">
          {realCompanyMetrics.length > 0
            ? "KPIs empresariais: CVM e simulação"
            : "KPIs empresariais simulados"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const value = current?.[metric.key];
          const previousValue = previous?.[metric.key];
          const difference =
            value !== undefined && previousValue !== undefined
              ? value - previousValue
              : null;

          const change =
            difference === null
              ? "—"
              : metric.key === "margem"
                ? `${Math.abs(difference).toLocaleString("pt-BR", {
                    maximumFractionDigits: 1,
                  })} p.p.`
                : previousValue === 0
                  ? "—"
                  : `${Math.abs((difference / previousValue!) * 100).toLocaleString(
                      "pt-BR",
                      { maximumFractionDigits: 1 },
                    )}%`;

          const isReal = realCompanyMetrics.some(
            (realMetric) => realMetric === metric.key,
          );
          const source = isReal ? "CVM" : "simulado";
          const comparison = previous
            ? `Comparado com ${previous.label}.`
            : "Sem período anterior para comparação.";
          const marginNote =
            metric.key === "margem" && filters.frequency === "anual"
              ? " Média das margens trimestrais."
              : "";

          return (
            <KpiCard
              key={metric.key}
              title={metric.title}
              value={value === undefined ? "—" : formatValue(value, metric.key)}
              change={change}
              description={`${comparison} Fonte: ${source}.${marginNote}`}
              trend={difference !== null && difference < 0 ? "down" : "up"}
              icon={metric.icon}
            />
          );
        })}
      </div>

      <HistoricalChartContent filters={filters} dashboardData={dashboardData} />
    </section>
  );
}

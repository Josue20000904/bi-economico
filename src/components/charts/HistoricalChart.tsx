"use client";

import { useMemo } from "react";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  companyMetricOptions,
  economicIndicatorOptions,
  frequencyOptions,
} from "@/data/dashboardOptions";

import {
  createDemoHistoricalData,
  type CompanyMetricKey,
  type EconomicIndicatorKey,
} from "@/data/historicalData";

import type { DashboardFiltersState } from "@/types/dashboard";

type HistoricalChartProps = {
  filters: DashboardFiltersState;
};

type ChartPoint = {
  label: string;
  year: number;
  companyValue: number;
  economicValue: number | null;
};

const flowMetrics = new Set<CompanyMetricKey>([
  "receita",
  "ebitda",
  "lucro",
]);

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return (
    values.reduce((total, value) => total + value, 0) /
    values.length
  );
}

function round(value: number, decimals = 1) {
  const multiplier = 10 ** decimals;

  return Math.round(value * multiplier) / multiplier;
}

function getPeriodRange(period: string) {
  const periodParts = period.split("-").map(Number);

  if (periodParts.length === 1) {
    return {
      startYear: periodParts[0],
      endYear: periodParts[0],
    };
  }

  return {
    startYear: periodParts[0],
    endYear: periodParts[1],
  };
}

function formatCompanyValue(
  value: number,
  metric: CompanyMetricKey,
) {
  if (metric === "margem") {
    return `${value.toLocaleString("pt-BR", {
      maximumFractionDigits: 1,
    })}%`;
  }

  if (metric === "acao") {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 2,
    });
  }

  return `R$ ${value.toLocaleString("pt-BR", {
    maximumFractionDigits: 1,
  })} bi`;
}

function formatEconomicValue(
  value: number,
  indicator: EconomicIndicatorKey,
) {
  if (
    indicator === "selic" ||
    indicator === "ipca" ||
    indicator === "desemprego"
  ) {
    return `${value.toLocaleString("pt-BR", {
      maximumFractionDigits: 2,
    })}%`;
  }

  if (indicator === "cambio") {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 2,
    });
  }

  if (indicator === "ibovespa") {
    return `${Math.round(value).toLocaleString("pt-BR")} pts`;
  }

  return `US$ ${value.toLocaleString("pt-BR", {
    maximumFractionDigits: 2,
  })}`;
}

function formatCompanyAxis(
  value: number,
  metric: CompanyMetricKey,
) {
  if (metric === "margem") {
    return `${value}%`;
  }

  if (metric === "acao") {
    return `R$ ${value}`;
  }

  return `${value}`;
}

function formatEconomicAxis(
  value: number,
  indicator: EconomicIndicatorKey,
) {
  if (
    indicator === "selic" ||
    indicator === "ipca" ||
    indicator === "desemprego"
  ) {
    return `${value}%`;
  }

  if (indicator === "cambio") {
    return `R$ ${value}`;
  }

  if (indicator === "ibovespa") {
    return `${Math.round(value / 1000)} mil`;
  }

  return `US$ ${value}`;
}

export function HistoricalChart({
  filters,
}: HistoricalChartProps) {
  const companyMetric =
    filters.companyMetric as CompanyMetricKey;

  const economicIndicator =
    filters.economicIndicator as EconomicIndicatorKey;

  const companyMetricLabel =
    companyMetricOptions.find(
      (option) => option.value === companyMetric,
    )?.label ?? companyMetric;

  const economicIndicatorLabel =
    economicIndicatorOptions.find(
      (option) => option.value === economicIndicator,
    )?.label ?? economicIndicator;

  const frequencyLabel =
    frequencyOptions.find(
      (option) => option.value === filters.frequency,
    )?.label ?? filters.frequency;

  const chartData = useMemo(() => {
    const historicalData =
      createDemoHistoricalData(filters.company);

    const { startYear, endYear } = getPeriodRange(
      filters.period,
    );

    const lagInQuarters =
      filters.lag === "automatico"
        ? 0
        : Number(filters.lag);

    const preparedData: ChartPoint[] = historicalData.map(
      (point, index) => {
        const laggedIndex = index - lagInQuarters;

        const laggedEconomicValue =
          laggedIndex >= 0
            ? historicalData[laggedIndex][
                economicIndicator
              ]
            : null;

        return {
          label: point.label,
          year: point.year,
          companyValue: point[companyMetric],
          economicValue: laggedEconomicValue,
        };
      },
    );

    const filteredData = preparedData.filter(
      (point) =>
        point.year >= startYear &&
        point.year <= endYear,
    );

    if (filters.frequency === "trimestral") {
      return filteredData;
    }

    const dataByYear = new Map<number, ChartPoint[]>();

    filteredData.forEach((point) => {
      const currentYearData =
        dataByYear.get(point.year) ?? [];

      currentYearData.push(point);
      dataByYear.set(point.year, currentYearData);
    });

    return Array.from(dataByYear.entries()).map(
      ([year, yearData]) => {
        const companyValues = yearData.map(
          (point) => point.companyValue,
        );

        const economicValues = yearData
          .map((point) => point.economicValue)
          .filter(
            (value): value is number => value !== null,
          );

        let annualCompanyValue: number;

        if (flowMetrics.has(companyMetric)) {
          annualCompanyValue = companyValues.reduce(
            (total, value) => total + value,
            0,
          );
        } else if (
          companyMetric === "divida" ||
          companyMetric === "acao"
        ) {
          annualCompanyValue =
            companyValues[companyValues.length - 1];
        } else {
          annualCompanyValue = average(companyValues);
        }

        return {
          label: String(year),
          year,
          companyValue: round(annualCompanyValue),
          economicValue:
            economicValues.length > 0
              ? round(average(economicValues), 2)
              : null,
        };
      },
    );
  }, [
    companyMetric,
    economicIndicator,
    filters.company,
    filters.frequency,
    filters.lag,
    filters.period,
  ]);

  return (
    <section className="mt-6 rounded-2xl border border-white/10 bg-[#07111f] p-5">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">
            Série histórica
          </p>

          <h3 className="mt-2 text-lg font-semibold text-white">
            {companyMetricLabel} × {economicIndicatorLabel}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Comparação histórica com escalas independentes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
            {frequencyLabel}
          </span>

          <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs text-amber-300">
            Dados simulados
          </span>
        </div>
      </div>

      <div className="h-[360px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 10,
              right: 10,
              left: 0,
              bottom: 5,
            }}
          >
            <CartesianGrid
              stroke="rgba(148, 163, 184, 0.10)"
              strokeDasharray="4 4"
              vertical={false}
            />

            <XAxis
              dataKey="label"
              stroke="#64748b"
              tick={{
                fill: "#64748b",
                fontSize: 11,
              }}
              tickLine={false}
              axisLine={false}
              minTickGap={24}
            />

            <YAxis
              yAxisId="company"
              orientation="left"
              stroke="#38bdf8"
              tick={{
                fill: "#64748b",
                fontSize: 11,
              }}
              tickLine={false}
              axisLine={false}
              width={55}
              tickFormatter={(value) =>
                formatCompanyAxis(
                  Number(value),
                  companyMetric,
                )
              }
            />

            <YAxis
              yAxisId="economic"
              orientation="right"
              stroke="#fbbf24"
              tick={{
                fill: "#64748b",
                fontSize: 11,
              }}
              tickLine={false}
              axisLine={false}
              width={60}
              tickFormatter={(value) =>
                formatEconomicAxis(
                  Number(value),
                  economicIndicator,
                )
              }
            />

            <Tooltip
              cursor={{
                stroke: "rgba(251, 191, 36, 0.30)",
                strokeDasharray: "4 4",
              }}
              contentStyle={{
                backgroundColor: "#07111f",
                border:
                  "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "12px",
                boxShadow:
                  "0 16px 40px rgba(0, 0, 0, 0.35)",
              }}
              labelStyle={{
                color: "#f8fafc",
                marginBottom: "8px",
              }}
              itemStyle={{
                color: "#cbd5e1",
              }}
              formatter={(value, name) => {
                const numericValue = Number(value);

                if (name === companyMetricLabel) {
                  return [
                    formatCompanyValue(
                      numericValue,
                      companyMetric,
                    ),
                    companyMetricLabel,
                  ];
                }

                return [
                  formatEconomicValue(
                    numericValue,
                    economicIndicator,
                  ),
                  economicIndicatorLabel,
                ];
              }}
            />

            <Legend
              wrapperStyle={{
                paddingTop: "18px",
                color: "#94a3b8",
                fontSize: "12px",
              }}
            />

            <Line
              yAxisId="company"
              type="monotone"
              dataKey="companyValue"
              name={companyMetricLabel}
              stroke="#38bdf8"
              strokeWidth={2.5}
              dot={false}
              activeDot={{
                r: 5,
                fill: "#38bdf8",
                stroke: "#07111f",
                strokeWidth: 2,
              }}
            />

            <Line
              yAxisId="economic"
              type="monotone"
              dataKey="economicValue"
              name={economicIndicatorLabel}
              stroke="#fbbf24"
              strokeWidth={2.5}
              strokeDasharray="7 5"
              dot={false}
              connectNulls
              activeDot={{
                r: 5,
                fill: "#fbbf24",
                stroke: "#07111f",
                strokeWidth: 2,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {filters.lag === "automatico" && (
        <p className="mt-4 text-xs leading-5 text-slate-500">
          A defasagem automática será calculada no Laboratório
          de Relações. Nesta visualização inicial, as séries estão
          alinhadas no mesmo período.
        </p>
      )}
    </section>
  );
}
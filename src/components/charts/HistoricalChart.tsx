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
import type {
  CompanyMetricKey,
  EconomicIndicatorKey,
} from "@/data/historicalData";
import { useDashboardHistoricalData } from "@/hooks/useDashboardHistoricalData";
import type { DashboardFiltersState } from "@/types/dashboard";

type HistoricalChartProps = {
  filters: DashboardFiltersState;
};

type HistoricalChartContentProps = HistoricalChartProps & {
  dashboardData: ReturnType<typeof useDashboardHistoricalData>;
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
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function round(value: number, decimals = 1) {
  const multiplier = 10 ** decimals;
  return Math.round(value * multiplier) / multiplier;
}

function aggregateAnnualEconomicValue(
  values: number[],
  indicator: EconomicIndicatorKey,
) {
  if (values.length === 0) return 0;

  if (indicator === "ipca") {
    return (
      values.reduce(
        (accumulator, value) => accumulator * (1 + value / 100),
        1,
      ) - 1
    ) * 100;
  }

  if (indicator === "selic" || indicator === "ibovespa") {
    return values[values.length - 1];
  }

  return average(values);
}

function formatCompanyValue(value: number, metric: CompanyMetricKey) {
  if (metric === "margem") {
    return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
  }
  if (metric === "acao") {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 2,
    });
  }
  return `R$ ${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} bi`;
}

function formatEconomicValue(value: number, indicator: EconomicIndicatorKey) {
  if (["selic", "ipca", "desemprego"].includes(indicator)) {
    return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
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
  return `US$ ${value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}`;
}

function formatCompanyAxis(value: number, metric: CompanyMetricKey) {
  if (metric === "margem") return `${value}%`;
  if (metric === "acao") return `R$ ${value}`;
  return `${value}`;
}

function formatEconomicAxis(value: number, indicator: EconomicIndicatorKey) {
  if (["selic", "ipca", "desemprego"].includes(indicator)) {
    return `${value}%`;
  }
  if (indicator === "cambio") return `R$ ${value}`;
  if (indicator === "ibovespa") return `${Math.round(value / 1000)} mil`;
  return `US$ ${value}`;
}

export function HistoricalChart({ filters }: HistoricalChartProps) {
  const dashboardData = useDashboardHistoricalData(filters);
  return <HistoricalChartContent filters={filters} dashboardData={dashboardData} />;
}

export function HistoricalChartContent({
  filters,
  dashboardData,
}: HistoricalChartContentProps) {
  const companyMetric = filters.companyMetric as CompanyMetricKey;
  const economicIndicator = filters.economicIndicator as EconomicIndicatorKey;

  const {
    historicalData,
    hasRealEconomicData,
    economicData,
    isEconomicDataLoading,
    economicDataError,
    isEconomicDataSupported,
    hasRealCompanyData,
    companyDataSource,
    companyDataError,
  } = dashboardData;

  const companyMetricLabel =
    companyMetricOptions.find((option) => option.value === companyMetric)?.label ??
    companyMetric;
  const economicIndicatorLabel =
    economicIndicatorOptions.find((option) => option.value === economicIndicator)
      ?.label ?? economicIndicator;
  const frequencyLabel =
    frequencyOptions.find((option) => option.value === filters.frequency)?.label ??
    filters.frequency;

  const chartData = useMemo(() => {
    const startYear = Number(filters.startYear);
    const endYear = Number(filters.endYear);
    // "Automático" é calculado apenas no Laboratório de Relações.
    const lagInQuarters =
      filters.lag === "automatico" ? 0 : Number(filters.lag);

    // O hook pode conter valores simulados em lacunas da série do BCB.
    // Quando houver resposta real, deixamos essas lacunas vazias no gráfico.
    const realEconomicLabels = new Set(
      economicData?.data
        .filter((point) => Number.isFinite(point.value))
        .map((point) => point.label) ?? [],
    );

    const preparedData: ChartPoint[] = historicalData.map((point, index) => {
      const laggedPoint = historicalData[index - lagInQuarters];
      let economicValue: number | null = null;

      if (laggedPoint && !(isEconomicDataSupported && isEconomicDataLoading)) {
        const isRealGap =
          hasRealEconomicData && !realEconomicLabels.has(laggedPoint.label);

        if (!isRealGap) {
          const value = laggedPoint[economicIndicator];
          economicValue = Number.isFinite(value) ? value : null;
        }
      }

      return {
        label: point.label,
        year: point.year,
        companyValue: point[companyMetric],
        economicValue,
      };
    });

    const filteredData = preparedData.filter(
      (point) => point.year >= startYear && point.year <= endYear,
    );

    if (filters.frequency === "trimestral") return filteredData;

    const dataByYear = new Map<number, ChartPoint[]>();
    for (const point of filteredData) {
      const points = dataByYear.get(point.year) ?? [];
      points.push(point);
      dataByYear.set(point.year, points);
    }

    return Array.from(dataByYear.entries()).map(([year, yearData]) => {
      const companyValues = yearData.map((point) => point.companyValue);
      const economicValues = yearData
        .map((point) => point.economicValue)
        .filter((value): value is number => value !== null);

      let annualCompanyValue: number;
      if (flowMetrics.has(companyMetric)) {
        annualCompanyValue = companyValues.reduce(
          (total, value) => total + value,
          0,
        );
      } else if (companyMetric === "divida" || companyMetric === "acao") {
        annualCompanyValue = companyValues[companyValues.length - 1];
      } else {
        annualCompanyValue = average(companyValues);
      }

      const annualEconomicValue =
        economicValues.length === yearData.length
          ? aggregateAnnualEconomicValue(economicValues, economicIndicator)
          : null;

      return {
        label: String(year),
        year,
        companyValue: round(annualCompanyValue),
        economicValue:
          annualEconomicValue === null ? null : round(annualEconomicValue, 2),
      };
    });
  }, [
    companyMetric,
    economicData,
    economicIndicator,
    filters.endYear,
    filters.frequency,
    filters.lag,
    filters.startYear,
    hasRealEconomicData,
    historicalData,
    isEconomicDataLoading,
    isEconomicDataSupported,
  ]);

  const missingEconomicPoints = chartData.some(
    (point) => point.economicValue === null,
  );
  const hasDisplayedEconomicPoints = chartData.some(
    (point) => point.economicValue !== null,
  );

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
          {hasRealCompanyData ? (
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-300">
              Empresa real · {companyDataSource}
            </span>
          ) : (
            <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs text-amber-300">
              Empresa simulada
            </span>
          )}

          {isEconomicDataLoading && isEconomicDataSupported ? (
            <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1.5 text-xs text-sky-300">
              Carregando Banco Central...
            </span>
          ) : hasRealEconomicData && hasDisplayedEconomicPoints ? (
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-300">
              Indicador real · BCB{missingEconomicPoints ? " · série parcial" : ""}
            </span>
          ) : hasRealEconomicData ? (
            <span className="rounded-full border border-slate-400/20 bg-slate-400/10 px-3 py-1.5 text-xs text-slate-300">
              BCB · sem dados neste período
            </span>
          ) : (
            <span className="rounded-full border border-slate-400/20 bg-slate-400/10 px-3 py-1.5 text-xs text-slate-300">
              Indicador simulado
            </span>
          )}
        </div>
      </div>

      <div className="h-[360px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
          >
            <CartesianGrid
              stroke="rgba(148, 163, 184, 0.10)"
              strokeDasharray="4 4"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              stroke="#64748b"
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              minTickGap={24}
            />
            <YAxis
              yAxisId="company"
              orientation="left"
              stroke="#38bdf8"
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={55}
              tickFormatter={(value) =>
                formatCompanyAxis(Number(value), companyMetric)
              }
            />
            <YAxis
              yAxisId="economic"
              orientation="right"
              stroke="#fbbf24"
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={60}
              tickFormatter={(value) =>
                formatEconomicAxis(Number(value), economicIndicator)
              }
            />
            <Tooltip
              cursor={{ stroke: "rgba(251, 191, 36, 0.30)", strokeDasharray: "4 4" }}
              contentStyle={{
                backgroundColor: "#07111f",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "12px",
                boxShadow: "0 16px 40px rgba(0, 0, 0, 0.35)",
              }}
              labelStyle={{ color: "#f8fafc", marginBottom: "8px" }}
              itemStyle={{ color: "#cbd5e1" }}
              formatter={(value, name) => {
                const numericValue = Number(value);
                if (name === companyMetricLabel) {
                  return [
                    formatCompanyValue(numericValue, companyMetric),
                    companyMetricLabel,
                  ];
                }
                return [
                  formatEconomicValue(numericValue, economicIndicator),
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
              connectNulls={false}
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

      {companyDataError && (
        <p className="mt-4 rounded-lg border border-amber-400/15 bg-amber-400/[0.05] px-3 py-2 text-xs text-amber-300">
          {companyDataError}
        </p>
      )}
      {economicDataError && isEconomicDataSupported && (
        <p className="mt-4 rounded-lg border border-rose-400/15 bg-rose-400/[0.05] px-3 py-2 text-xs text-rose-300">
          Não foi possível consultar o Banco Central. O indicador econômico
          simulado foi utilizado temporariamente.
        </p>
      )}
      {hasRealEconomicData && economicData && (
        <p className="mt-4 text-xs leading-5 text-slate-500">
          {economicIndicatorLabel}: dados reais obtidos de {economicData.source},
          série SGS {economicData.seriesCode}.
          {missingEconomicPoints &&
            " Períodos sem dado disponível não foram preenchidos com valores simulados."}
          {hasRealCompanyData
            ? ` A métrica da empresa exibida vem da ${companyDataSource}.`
            : " A métrica da empresa exibida é simulada."}
        </p>
      )}
      {!isEconomicDataSupported && (
        <p className="mt-4 text-xs leading-5 text-slate-500">
          A integração real deste indicador será realizada em outra fonte. Nesta
          visualização ele permanece simulado.
        </p>
      )}
      {filters.lag === "automatico" && (
        <p className="mt-2 text-xs leading-5 text-slate-500">
          A defasagem automática é calculada no Laboratório de Relações. Nesta
          visualização, as séries estão alinhadas no mesmo período.
        </p>
      )}
    </section>
  );
}

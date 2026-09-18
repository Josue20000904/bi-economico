"use client";

import { useMemo } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Gauge,
  Minus,
  SearchCheck,
  TriangleAlert,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { companyMetricOptions } from "@/data/dashboardOptions";

import {
  createDemoHistoricalData,
  type CompanyMetricKey,
} from "@/data/historicalData";

import {
  analyzeMetricDiagnostics,
  classifyVolatility,
} from "@/lib/diagnostics";

import type { DashboardFiltersState } from "@/types/dashboard";

type DiagnosticsPanelProps = {
  filters: DashboardFiltersState;
};

function formatDecimal(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number) {
  const signal = value > 0 ? "+" : "";

  return `${signal}${formatDecimal(value)}%`;
}

function formatMetricValue(
  value: number,
  metric: CompanyMetricKey,
) {
  if (metric === "margem") {
    return `${formatDecimal(value)}%`;
  }

  if (metric === "acao") {
    return `R$ ${formatDecimal(value)}`;
  }

  return `R$ ${formatDecimal(value)} bi`;
}

export function DiagnosticsPanel({
  filters,
}: DiagnosticsPanelProps) {
  const analysis = useMemo(() => {
    const metric =
      filters.companyMetric as CompanyMetricKey;

    const startYear = Number(filters.startYear);
    const endYear = Number(filters.endYear);

    const historicalData = createDemoHistoricalData(
      filters.company,
    ).filter(
      (point) =>
        point.year >= startYear &&
        point.year <= endYear,
    );

    const diagnostics = analyzeMetricDiagnostics(
      historicalData,
      metric,
    );

    return {
      metric,
      diagnostics,
    };
  }, [
    filters.company,
    filters.companyMetric,
    filters.startYear,
    filters.endYear,
  ]);

  const metricLabel =
    companyMetricOptions.find(
      (option) => option.value === analysis.metric,
    )?.label ?? analysis.metric;

  const volatilityLabel = classifyVolatility(
    analysis.diagnostics.coefficientVariation,
  );

  const trendContent = {
    growth: {
      label: "Tendência de crescimento",
      description:
        "A série apresenta direção histórica predominantemente positiva.",
      icon: TrendingUp,
      iconClass:
        "bg-emerald-400/10 text-emerald-400",
      valueClass: "text-emerald-400",
    },
    decline: {
      label: "Tendência de queda",
      description:
        "A série apresenta direção histórica predominantemente negativa.",
      icon: TrendingDown,
      iconClass: "bg-rose-400/10 text-rose-400",
      valueClass: "text-rose-400",
    },
    stable: {
      label: "Tendência estável",
      description:
        "Não foi identificada uma direção histórica relevante.",
      icon: Minus,
      iconClass: "bg-slate-400/10 text-slate-400",
      valueClass: "text-slate-300",
    },
  }[analysis.diagnostics.trend];

  const TrendIcon = trendContent.icon;

  const totalChangeClass =
    analysis.diagnostics.totalChangePercent > 0
      ? "text-emerald-400"
      : analysis.diagnostics.totalChangePercent < 0
        ? "text-rose-400"
        : "text-slate-300";

  return (
    <section>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">
            Diagnóstico estatístico
          </p>

          <h3 className="mt-2 text-xl font-semibold text-white">
            Padrões e mudanças em {metricLabel}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Análise automática da série entre{" "}
            {filters.startYear} e {filters.endYear}.
          </p>
        </div>

        <span className="self-start rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 sm:self-auto">
          Método estatístico exploratório
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-white/10 bg-[#07111f] p-5">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${trendContent.iconClass}`}
          >
            <TrendIcon size={19} />
          </div>

          <p className="mt-4 text-sm text-slate-400">
            Tendência histórica
          </p>

          <p
            className={`mt-1 text-lg font-semibold ${trendContent.valueClass}`}
          >
            {trendContent.label}
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            {trendContent.description}
          </p>
        </article>

        <article className="rounded-2xl border border-white/10 bg-[#07111f] p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-400/10 text-sky-400">
            <Activity size={19} />
          </div>

          <p className="mt-4 text-sm text-slate-400">
            Variação no período
          </p>

          <p
            className={`mt-1 text-2xl font-semibold ${totalChangeClass}`}
          >
            {formatPercent(
              analysis.diagnostics.totalChangePercent,
            )}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            Diferença entre a primeira e a última observação.
          </p>
        </article>

        <article className="rounded-2xl border border-white/10 bg-[#07111f] p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-400/10 text-violet-400">
            <Gauge size={19} />
          </div>

          <p className="mt-4 text-sm text-slate-400">
            Volatilidade
          </p>

          <p className="mt-1 text-2xl font-semibold text-white">
            {volatilityLabel}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            Coeficiente de variação:{" "}
            {formatDecimal(
              analysis.diagnostics.coefficientVariation,
            )}
            %.
          </p>
        </article>

        <article className="rounded-2xl border border-white/10 bg-[#07111f] p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400">
            <SearchCheck size={19} />
          </div>

          <p className="mt-4 text-sm text-slate-400">
            Pontos atípicos
          </p>

          <p className="mt-1 text-2xl font-semibold text-white">
            {analysis.diagnostics.anomalies.length}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            Observações com desvio igual ou superior a 1,5.
          </p>
        </article>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-[#07111f] p-5">
          <div className="mb-5">
            <h4 className="font-semibold text-white">
              Principais mudanças
            </h4>

            <p className="mt-1 text-sm text-slate-500">
              Maiores variações entre períodos consecutivos.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.05] p-4">
              <div className="flex items-center gap-2 text-emerald-400">
                <ArrowUpRight size={18} />

                <span className="text-sm font-medium">
                  Maior crescimento
                </span>
              </div>

              {analysis.diagnostics.largestIncrease ? (
                <>
                  <p className="mt-4 text-2xl font-semibold text-white">
                    {formatPercent(
                      analysis.diagnostics
                        .largestIncrease
                        .variationPercent,
                    )}
                  </p>

                  <p className="mt-2 text-sm text-slate-400">
                    {
                      analysis.diagnostics
                        .largestIncrease.label
                    }
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Valor:{" "}
                    {formatMetricValue(
                      analysis.diagnostics
                        .largestIncrease.value,
                      analysis.metric,
                    )}
                  </p>
                </>
              ) : (
                <p className="mt-4 text-sm text-slate-500">
                  Dados insuficientes.
                </p>
              )}
            </div>

            <div className="rounded-xl border border-rose-400/15 bg-rose-400/[0.05] p-4">
              <div className="flex items-center gap-2 text-rose-400">
                <ArrowDownRight size={18} />

                <span className="text-sm font-medium">
                  Maior queda
                </span>
              </div>

              {analysis.diagnostics.largestDrop ? (
                <>
                  <p className="mt-4 text-2xl font-semibold text-white">
                    {formatPercent(
                      analysis.diagnostics.largestDrop
                        .variationPercent,
                    )}
                  </p>

                  <p className="mt-2 text-sm text-slate-400">
                    {
                      analysis.diagnostics.largestDrop
                        .label
                    }
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Valor:{" "}
                    {formatMetricValue(
                      analysis.diagnostics.largestDrop
                        .value,
                      analysis.metric,
                    )}
                  </p>
                </>
              ) : (
                <p className="mt-4 text-sm text-slate-500">
                  Dados insuficientes.
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-xs text-slate-500">
                  Média
                </p>

                <p className="mt-1 text-sm font-semibold text-white">
                  {formatMetricValue(
                    analysis.diagnostics.average,
                    analysis.metric,
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Desvio-padrão
                </p>

                <p className="mt-1 text-sm font-semibold text-white">
                  {formatDecimal(
                    analysis.diagnostics
                      .standardDeviation,
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Valor inicial
                </p>

                <p className="mt-1 text-sm font-semibold text-white">
                  {formatMetricValue(
                    analysis.diagnostics.firstValue,
                    analysis.metric,
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Valor final
                </p>

                <p className="mt-1 text-sm font-semibold text-white">
                  {formatMetricValue(
                    analysis.diagnostics.latestValue,
                    analysis.metric,
                  )}
                </p>
              </div>
            </div>
          </div>
        </article>

        <article className="overflow-hidden rounded-2xl border border-white/10 bg-[#07111f]">
          <div className="border-b border-white/10 px-5 py-4">
            <div className="flex items-center gap-2">
              <TriangleAlert
                size={18}
                className="text-amber-400"
              />

              <h4 className="font-semibold text-white">
                Observações atípicas
              </h4>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Pontos mais distantes do comportamento médio.
            </p>
          </div>

          {analysis.diagnostics.anomalies.length > 0 ? (
            <div className="divide-y divide-white/5">
              {analysis.diagnostics.anomalies.map(
                (anomaly) => (
                  <div
                    key={anomaly.label}
                    className="flex items-center justify-between gap-4 px-5 py-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-200">
                        {anomaly.label}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {anomaly.direction === "above"
                          ? "Acima"
                          : "Abaixo"}{" "}
                        da média histórica
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">
                        {formatMetricValue(
                          anomaly.value,
                          analysis.metric,
                        )}
                      </p>

                      <span
                        className={`mt-1 inline-flex rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${
                          anomaly.severity === "critical"
                            ? "bg-rose-400/10 text-rose-300"
                            : "bg-amber-400/10 text-amber-300"
                        }`}
                      >
                        Z-score{" "}
                        {formatDecimal(anomaly.zScore)}
                      </span>
                    </div>
                  </div>
                ),
              )}
            </div>
          ) : (
            <div className="flex min-h-64 items-center justify-center p-6 text-center">
              <div>
                <SearchCheck
                  size={28}
                  className="mx-auto text-emerald-400"
                />

                <p className="mt-3 text-sm font-medium text-slate-300">
                  Nenhuma anomalia relevante
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Os valores permanecem dentro do intervalo
                  estatístico esperado.
                </p>
              </div>
            </div>
          )}
        </article>
      </div>

      <div className="mt-4 rounded-2xl border border-amber-400/15 bg-amber-400/[0.05] p-5">
        <div className="flex items-start gap-3">
          <TriangleAlert
            size={19}
            className="mt-0.5 shrink-0 text-amber-400"
          />

          <div>
            <h4 className="font-semibold text-amber-200">
              Como interpretar
            </h4>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Os alertas identificam desvios estatísticos e
              mudanças relevantes, mas não determinam sua causa.
              Eventos econômicos, decisões empresariais e alterações
              contábeis devem ser considerados na análise.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
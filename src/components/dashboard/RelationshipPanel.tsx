"use client";

import { useMemo } from "react";

import {
  Activity,
  Clock3,
  Database,
  Lightbulb,
  Sigma,
  TriangleAlert,
} from "lucide-react";

import { RelationshipScatterChart } from "@/components/charts/RelationshipScatterChart";

import {
  companyMetricOptions,
  economicIndicatorOptions,
} from "@/data/dashboardOptions";

import type {
  CompanyMetricKey,
  EconomicIndicatorKey,
} from "@/data/historicalData";

import { useDashboardHistoricalData } from "@/hooks/useDashboardHistoricalData";

import {
  analyzeLags,
  classifyCorrelation,
  createLaggedPairs,
  findBestLag,
  linearRegression,
} from "@/lib/analytics";
import type { AnalysisOptions } from "@/lib/analytics";

import type { DashboardFiltersState } from "@/types/dashboard";

type RelationshipPanelProps = {
  filters: DashboardFiltersState;
};

function formatDecimal(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "—";
  }

  return value.toFixed(2).replace(".", ",");
}

function formatLag(lag: number) {
  if (lag === 0) {
    return "Sem defasagem";
  }

  if (lag === 1) {
    return "1 trimestre";
  }

  return `${lag} trimestres`;
}

export function RelationshipPanel({
  filters,
}: RelationshipPanelProps) {
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
  } = useDashboardHistoricalData(filters);

  const analysis = useMemo(() => {
    const companyMetric =
      filters.companyMetric as CompanyMetricKey;

    const economicIndicator =
      filters.economicIndicator as EconomicIndicatorKey;

    const startYear = Number(filters.startYear);
    const endYear = Number(filters.endYear);

    const realEconomicLabels = new Set(
      economicData?.data
        .filter((point) => Number.isFinite(point.value))
        .map((point) => point.label) ?? [],
    );

    // Conserva o ano anterior para a defasagem no início do período.
    // Na presença de dados reais, uma lacuna do BCB não vira valor simulado.
    const preparedData = historicalData
      .filter((point) => point.year <= endYear)
      .map((point) => ({
        ...point,
        [economicIndicator]:
          (isEconomicDataSupported && isEconomicDataLoading) ||
          (hasRealEconomicData && !realEconomicLabels.has(point.label))
            ? NaN
            : point[economicIndicator],
      }));

    const options: AnalysisOptions = {
      frequency: filters.frequency === "anual" ? "anual" : "trimestral",
      startYear,
      endYear,
    };

    const lagResults = analyzeLags(
      preparedData,
      companyMetric,
      economicIndicator,
      [0, 1, 2, 4],
      options,
    );

    const bestLagResult =
      findBestLag(lagResults);

    const selectedLag =
      filters.lag === "automatico"
        ? (bestLagResult?.lag ?? 0)
        : Number(filters.lag);

    const relationshipPoints =
      createLaggedPairs(
        preparedData,
        companyMetric,
        economicIndicator,
        selectedLag,
        options,
      );

    const selectedLagResult = lagResults.find(
      (result) => result.lag === selectedLag,
    );
    const correlation = selectedLagResult?.valid
      ? selectedLagResult.correlation
      : null;

    const classification = correlation === null
      ? null
      : classifyCorrelation(correlation);

    const regression = correlation === null
      ? null
      : linearRegression(relationshipPoints);

    return {
      companyMetric,
      economicIndicator,
      lagResults,
      bestLagResult,
      selectedLag,
      selectedLagResult,
      relationshipPoints,
      correlation,
      classification,
      regression,
      hasEconomicCoverage: hasRealEconomicData &&
        lagResults.some((result) => result.observations > 0),
    };
  }, [
    filters.companyMetric,
    filters.economicIndicator,
    filters.lag,
    filters.startYear,
    filters.endYear,
    filters.frequency,
    historicalData,
    economicData,
    hasRealEconomicData,
    isEconomicDataLoading,
    isEconomicDataSupported,
  ]);

  const companyMetricLabel =
    companyMetricOptions.find(
      (option) =>
        option.value === analysis.companyMetric,
    )?.label ?? analysis.companyMetric;

  const economicIndicatorLabel =
    economicIndicatorOptions.find(
      (option) =>
        option.value ===
        analysis.economicIndicator,
    )?.label ?? analysis.economicIndicator;

  const correlationColor =
    analysis.correlation !== null && analysis.correlation > 0
      ? "text-emerald-400"
      : analysis.correlation !== null && analysis.correlation < 0
        ? "text-rose-400"
        : "text-slate-400";

  return (
    <section>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">
            Laboratório de relações
          </p>

          <h3 className="mt-2 text-xl font-semibold text-white">
            {companyMetricLabel} ×{" "}
            {economicIndicatorLabel}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Associação histórica considerando
            diferentes defasagens temporais.
          </p>
        </div>

        <span
          className={`self-start rounded-full border px-3 py-1.5 text-xs sm:self-auto ${
            analysis.hasEconomicCoverage
              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
              : "border-white/10 bg-white/5 text-slate-300"
          }`}
        >
          {isEconomicDataLoading &&
          isEconomicDataSupported
            ? "Carregando Banco Central..."
            : analysis.hasEconomicCoverage
              ? `${filters.startYear} a ${filters.endYear} · Indicador real · BCB`
              : hasRealEconomicData
                ? `${filters.startYear} a ${filters.endYear} · BCB sem pares válidos`
              : `${filters.startYear} a ${filters.endYear} · Indicador simulado`}
        </span>
      </div>

      {economicDataError &&
        isEconomicDataSupported && (
          <div className="mb-5 rounded-xl border border-rose-400/15 bg-rose-400/[0.05] px-4 py-3">
            <p className="text-sm text-rose-300">
              Não foi possível consultar o Banco
              Central. A análise está utilizando
              temporariamente o indicador simulado.
            </p>
          </div>
        )}

      {companyDataError && (
        <p className="mb-5 rounded-xl border border-amber-400/20 bg-amber-400/[0.05] px-4 py-3 text-sm text-amber-300">
          {companyDataError}
        </p>
      )}

      <p className="mb-5 text-xs leading-5 text-slate-500">
        {filters.frequency === "anual" ? "Cada par representa um ano completo." : "Cada par representa um trimestre."}
        {" "}Defasagens de 0, 1, 2 e 4 trimestres; mínimo de {filters.frequency === "anual" ? "5 anos" : "8 trimestres"} para apresentar uma correlação.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-white/10 bg-[#07111f] p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-400/10 text-sky-400">
            <Activity size={19} />
          </div>

          <p className="mt-4 text-sm text-slate-400">
            Correlação de Pearson
          </p>

          <p
            className={`mt-1 text-2xl font-semibold ${correlationColor}`}
          >
            {formatDecimal(
              analysis.correlation,
            )}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            {
              analysis.classification
                ?.interpretation ?? "Dados insuficientes ou série constante"
            }
          </p>
        </article>

        <article className="rounded-2xl border border-white/10 bg-[#07111f] p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400">
            <Clock3 size={19} />
          </div>

          <p className="mt-4 text-sm text-slate-400">
            Melhor defasagem
          </p>

          <p className="mt-1 text-2xl font-semibold text-white">
            {analysis.bestLagResult
              ? formatLag(analysis.bestLagResult.lag)
              : "—"}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            Maior associação absoluta entre as defasagens avaliadas.
          </p>
        </article>

        <article className="rounded-2xl border border-white/10 bg-[#07111f] p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-400/10 text-violet-400">
            <Sigma size={19} />
          </div>

          <p className="mt-4 text-sm text-slate-400">
            Coeficiente R²
          </p>

          <p className="mt-1 text-2xl font-semibold text-white">
            {formatDecimal(
              analysis.regression?.rSquared ?? null,
            )}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            Proporção da variação explicada
            linearmente.
          </p>
        </article>

        <article className="rounded-2xl border border-white/10 bg-[#07111f] p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400">
            <Database size={19} />
          </div>

          <p className="mt-4 text-sm text-slate-400">
            Observações
          </p>

          <p className="mt-1 text-2xl font-semibold text-white">
            {
              analysis.relationshipPoints
                .length
            }
          </p>

          <p className="mt-2 text-xs text-slate-500">
            Pares disponíveis no período selecionado.
          </p>
        </article>
      </div>

      <div className="mt-6">
        <RelationshipScatterChart
          points={analysis.correlation === null ? [] : analysis.relationshipPoints}
          xLabel={economicIndicatorLabel}
          yLabel={companyMetricLabel}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <article className="overflow-hidden rounded-2xl border border-white/10 bg-[#07111f]">
          <div className="border-b border-white/10 px-5 py-4">
            <h4 className="font-semibold text-white">
              Correlação por defasagem
            </h4>

            <p className="mt-1 text-sm text-slate-500">
              Associação observada com o indicador de trimestres anteriores.
            </p>
          </div>

          <div className="divide-y divide-white/5 md:hidden">
  {analysis.lagResults.map((result) => {
    const isSelected =
      result.lag === analysis.selectedLag;

    const barColor = !result.valid
      ? "bg-slate-600"
      : result.correlation >= 0
        ? "bg-emerald-400"
        : "bg-rose-400";

    const correlationColor = !result.valid
      ? "text-slate-500"
      : result.correlation >= 0
        ? "text-emerald-400"
        : "text-rose-400";

    return (
      <div
        key={result.lag}
        className={`p-5 ${
          isSelected ? "bg-amber-400/[0.06]" : ""
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-slate-200">
                {formatLag(result.lag)}
              </p>

              {isSelected && (
                <span className="rounded-full bg-amber-400/10 px-2 py-1 text-[10px] font-semibold uppercase text-amber-300">
                  Selecionada
                </span>
              )}
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Interpretação
            </p>

            <p className="mt-1 text-sm text-slate-300">
              {result.valid
                ? `${result.strength} ${result.direction}`
                : "Dados insuficientes ou série constante"}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-xs text-slate-500">
              Correlação
            </p>

            <p
              className={`mt-1 text-lg font-semibold ${correlationColor}`}
            >
              {result.valid
                ? formatDecimal(result.correlation)
                : "—"}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Intensidade</span>

            <span>
              {result.valid
                ? `${Math.round(
                    result.absoluteCorrelation * 100,
                  )}%`
                : "—"}
            </span>
          </div>

          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className={`h-full rounded-full ${barColor}`}
              style={{
                width: result.valid
                  ? `${Math.max(
                      4,
                      result.absoluteCorrelation * 100,
                    )}%`
                  : "0%",
              }}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4 text-xs">
          <span className="text-slate-500">
            Observações válidas
          </span>

          <span className="font-medium text-slate-300">
            {result.observations}
          </span>
        </div>
      </div>
    );
  })}
</div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[620px] text-left">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3 font-medium">
                    Defasagem
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Correlação
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Intensidade
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Interpretação
                  </th>

                  <th className="px-5 py-3 text-right font-medium">
                    Observações
                  </th>
                </tr>
              </thead>

              <tbody>
                {analysis.lagResults.map(
                  (result) => {
                    const isSelected =
                      result.lag ===
                      analysis.selectedLag;

                    const barColor =
                      !result.valid
                        ? "bg-slate-600"
                        : result.correlation >= 0
                        ? "bg-emerald-400"
                        : "bg-rose-400";

                    return (
                      <tr
                        key={result.lag}
                        className={`border-b border-white/5 last:border-b-0 ${
                          isSelected
                            ? "bg-amber-400/[0.06]"
                            : ""
                        }`}
                      >
                        <td className="px-5 py-4 text-sm text-slate-200">
                          {formatLag(
                            result.lag,
                          )}

                          {isSelected && (
                            <span className="ml-2 rounded-full bg-amber-400/10 px-2 py-1 text-[10px] font-semibold uppercase text-amber-300">
                              Selecionada
                            </span>
                          )}
                        </td>

                        <td
                          className={`px-5 py-4 text-sm font-semibold ${
                            !result.valid
                              ? "text-slate-500"
                              : result.correlation >= 0
                              ? "text-emerald-400"
                              : "text-rose-400"
                          }`}
                        >
                          {result.valid ? formatDecimal(result.correlation) : "—"}
                        </td>

                        <td className="px-5 py-4">
                          <div className="h-2 w-28 overflow-hidden rounded-full bg-white/5">
                            <div
                              className={`h-full rounded-full ${barColor}`}
                              style={{
                                width: result.valid
                                  ? `${Math.max(4, result.absoluteCorrelation * 100)}%`
                                  : "0%",
                              }}
                            />
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-400">
                          {result.valid
                            ? `${result.strength} ${result.direction}`
                            : "Dados insuficientes ou série constante"}
                        </td>

                        <td className="px-5 py-4 text-right text-sm text-slate-400">
                          {
                            result.observations
                          }
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        </article>

        <div className="space-y-4">
          <article className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-400/10 text-amber-400">
                <Lightbulb size={18} />
              </div>

              <div>
                <h4 className="font-semibold text-amber-200">
                  Leitura automática
                </h4>

                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {analysis.bestLagResult ? (
                    <>
                      A maior associação observada ocorreu com{" "}
                      <strong className="text-white">
                        {formatLag(analysis.bestLagResult.lag)}
                      </strong>
                      {", com correlação de "}
                      <strong className="text-white">
                        {formatDecimal(analysis.bestLagResult.correlation)}
                      </strong>
                      {` em ${analysis.bestLagResult.observations} pares válidos.`}
                    </>
                  ) : (
                    "Não há observações suficientes para escolher uma defasagem. Amplie o período ou selecione outras séries."
                  )}
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-rose-400/20 bg-rose-400/[0.05] p-5">
            <div className="flex items-start gap-3">
              <TriangleAlert
                size={19}
                className="mt-0.5 shrink-0 text-rose-400"
              />

              <div>
                <h4 className="font-semibold text-rose-200">
                  Cuidado na interpretação
                </h4>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Correlação histórica não demonstra causalidade. A escolha
                  da maior correlação entre várias defasagens é exploratória;
                  tendências ao longo do tempo e outros fatores podem influenciar
                  o resultado.
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-white/10 bg-[#07111f] p-5">
            <h4 className="font-semibold text-white">
              Origem dos dados
            </h4>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              {hasRealCompanyData
                ? `A métrica ${companyMetricLabel} vem da ${companyDataSource}.`
                : `A métrica ${companyMetricLabel} é simulada.`}
              {analysis.hasEconomicCoverage
                ? ` O indicador ${economicIndicatorLabel} vem do Banco Central; trimestres sem dados reais foram excluídos.`
                : hasRealEconomicData
                  ? ` O indicador ${economicIndicatorLabel} não tem pares reais válidos no período.`
                  : ` O indicador ${economicIndicatorLabel} é simulado nesta análise.`}
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}

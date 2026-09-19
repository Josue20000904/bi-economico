"use client";

import { useMemo } from "react";

import {
  createDemoHistoricalData,
  type EconomicIndicatorKey,
  type HistoricalPoint,
} from "@/data/historicalData";

import petr4Financials from "@/data/generated/petr4-financials.json";

import { useEconomicData } from "@/hooks/useEconomicData";

import type { DashboardFiltersState } from "@/types/dashboard";

// Margem e dívida serão integradas após conferirmos
// suas definições e seus rótulos no painel.
const CVM_METRICS = ["receita", "lucro"] as const;

type CvmFinancialPoint = {
  label: string;
  receita: number | null;
  lucro: number | null;
};

const cvmPointsByLabel = new Map<string, CvmFinancialPoint>(
  petr4Financials.data.map(
    (point): [string, CvmFinancialPoint] => [
      point.label,
      point,
    ],
  ),
);

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function useDashboardHistoricalData(
  filters: DashboardFiltersState,
) {
  const economicIndicator =
    filters.economicIndicator as EconomicIndicatorKey;

  const economicFetchStartYear = String(
    Math.max(2019, Number(filters.startYear) - 1),
  );

  const economicDataState = useEconomicData(
    economicIndicator,
    economicFetchStartYear,
    filters.endYear,
  );

  const hasRealEconomicData =
    economicDataState.isSupported &&
    !economicDataState.error &&
    Boolean(economicDataState.data?.data.length);

  const companyDataState = useMemo(() => {
    const demonstrationData =
      createDemoHistoricalData(filters.company);

    const isCvmCompany =
      filters.company === petr4Financials.company.ticker;

    // Uma métrica só é substituída quando todos os pontos
    // da série têm valores válidos na CVM.
    // Zero e valores negativos também são válidos.
    const realCompanyMetrics = CVM_METRICS.filter(
      (metric) =>
        isCvmCompany &&
        demonstrationData.length > 0 &&
        demonstrationData.every((point) =>
          isFiniteNumber(
            cvmPointsByLabel.get(point.label)?.[metric],
          ),
        ),
    );

    const data = demonstrationData.map(
      (point): HistoricalPoint => {
        if (realCompanyMetrics.length === 0) {
          return point;
        }

        const financialPoint = cvmPointsByLabel.get(
          point.label,
        );

        if (!financialPoint) {
          return point;
        }

        const mergedPoint: HistoricalPoint = {
          ...point,
        };

        for (const metric of realCompanyMetrics) {
          const value = financialPoint[metric];

          if (isFiniteNumber(value)) {
            // O JSON já contém os valores em R$ bilhões.
            mergedPoint[metric] = value;
          }
        }

        return mergedPoint;
      },
    );

    return {
      data,
      realCompanyMetrics,
      isCvmCompany,
    };
  }, [filters.company]);

  const historicalData = useMemo(() => {
    // Os dados da empresa são preservados mesmo quando
    // o indicador econômico não está disponível no BCB.
    if (!hasRealEconomicData) {
      return companyDataState.data;
    }

    const realEconomicValues = new Map(
      economicDataState.data?.data.map((point) => [
        point.label,
        point.value,
      ]) ?? [],
    );

    return companyDataState.data.map(
      (point): HistoricalPoint => {
        const realValue = realEconomicValues.get(
          point.label,
        );

        if (!isFiniteNumber(realValue)) {
          return point;
        }

        return {
          ...point,
          [economicIndicator]: realValue,
        };
      },
    );
  }, [
    companyDataState.data,
    economicDataState.data,
    economicIndicator,
    hasRealEconomicData,
  ]);

  // Indica a origem da métrica selecionada no filtro.
  const hasRealCompanyData =
    companyDataState.realCompanyMetrics.some(
      (metric) => metric === filters.companyMetric,
    );

  const isCompanyDataSupported =
    companyDataState.isCvmCompany &&
    CVM_METRICS.some(
      (metric) => metric === filters.companyMetric,
    );

  const companyDataError =
    isCompanyDataSupported && !hasRealCompanyData
      ? "A série da CVM está incompleta ou contém valores inválidos. Esta métrica permanece simulada."
      : null;

  return {
    historicalData,

    hasRealEconomicData,
    economicData: economicDataState.data,
    isEconomicDataLoading: economicDataState.isLoading,
    economicDataError: economicDataState.error,
    isEconomicDataSupported: economicDataState.isSupported,

    hasRealCompanyData,
    isCompanyDataSupported,
    realCompanyMetrics: companyDataState.realCompanyMetrics,
    companyDataSource: hasRealCompanyData
      ? "CVM"
      : "Simulado",
    companyDataError,
  };
}
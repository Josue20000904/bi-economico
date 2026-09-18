"use client";

import { useMemo } from "react";

import {
  createDemoHistoricalData,
  type EconomicIndicatorKey,
  type HistoricalPoint,
} from "@/data/historicalData";

import { useEconomicData } from "@/hooks/useEconomicData";

import type { DashboardFiltersState } from "@/types/dashboard";

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

  const historicalData = useMemo(() => {
    const demonstrationData =
      createDemoHistoricalData(filters.company);

    if (!hasRealEconomicData) {
      return demonstrationData;
    }

    const realEconomicValues = new Map(
      economicDataState.data?.data.map((point) => [
        point.label,
        point.value,
      ]) ?? [],
    );

    return demonstrationData.map(
      (point): HistoricalPoint => {
        const realValue = realEconomicValues.get(
          point.label,
        );

        if (realValue === undefined) {
          return point;
        }

        return {
          ...point,
          [economicIndicator]: realValue,
        };
      },
    );
  }, [
    economicDataState.data,
    economicIndicator,
    filters.company,
    hasRealEconomicData,
  ]);

  return {
    historicalData,
    hasRealEconomicData,
    economicData: economicDataState.data,
    isEconomicDataLoading:
      economicDataState.isLoading,
    economicDataError:
      economicDataState.error,
    isEconomicDataSupported:
      economicDataState.isSupported,
  };
}
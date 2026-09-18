"use client";

import { useEffect, useState } from "react";

export type EconomicDataPoint = {
  label: string;
  year: number;
  quarter: number;
  value: number;
  observations: number;
};

export type EconomicDataResponse = {
  source: string;
  indicator: string;
  indicatorLabel: string;
  seriesCode: number;
  unit: string;
  frequency: "quarterly";
  startYear: number;
  endYear: number;
  data: EconomicDataPoint[];
};

type EconomicDataState = {
  data: EconomicDataResponse | null;
  isLoading: boolean;
  error: string | null;
  isSupported: boolean;
};

const supportedIndicators = [
  "selic",
  "ipca",
  "cambio",
];

function isSupportedIndicator(indicator: string) {
  return supportedIndicators.includes(indicator);
}

export function useEconomicData(
  indicator: string,
  startYear: string,
  endYear: string,
): EconomicDataState {
  const supported =
    isSupportedIndicator(indicator);

  const [state, setState] =
    useState<EconomicDataState>({
      data: null,
      isLoading: supported,
      error: null,
      isSupported: supported,
    });

  useEffect(() => {
    if (!supported) {
      setState({
        data: null,
        isLoading: false,
        error: null,
        isSupported: false,
      });

      return;
    }

    const controller = new AbortController();

    async function loadEconomicData() {
      setState({
        data: null,
        isLoading: true,
        error: null,
        isSupported: true,
      });

      try {
        const searchParams = new URLSearchParams({
          indicator,
          startYear,
          endYear,
        });

        const response = await fetch(
          `/api/economic-data?${searchParams.toString()}`,
          {
            signal: controller.signal,
          },
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ??
              "Não foi possível carregar os dados.",
          );
        }

        setState({
          data: result as EconomicDataResponse,
          isLoading: false,
          error: null,
          isSupported: true,
        });
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        setState({
          data: null,
          isLoading: false,
          error:
            error instanceof Error
              ? error.message
              : "Erro desconhecido.",
          isSupported: true,
        });
      }
    }

    void loadEconomicData();

    return () => {
      controller.abort();
    };
  }, [
    indicator,
    startYear,
    endYear,
    supported,
  ]);

  return state;
}
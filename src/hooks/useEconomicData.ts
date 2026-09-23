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

type RequestState = {
  requestKey: string | null;
  data: EconomicDataResponse | null;
  error: string | null;
};

const supportedIndicators = [
  "selic",
  "ipca",
  "cambio",
];

function isSupportedIndicator(indicator: string) {
  return supportedIndicators.includes(indicator);
}

function getErrorMessage(result: unknown) {
  if (
    typeof result === "object" &&
    result !== null &&
    "error" in result &&
    typeof result.error === "string"
  ) {
    return result.error;
  }

  return "Não foi possível carregar os dados.";
}

export function useEconomicData(
  indicator: string,
  startYear: string,
  endYear: string,
): EconomicDataState {
  const supported =
    isSupportedIndicator(indicator);

  const requestKey = supported
    ? `${indicator}:${startYear}:${endYear}`
    : null;

  const [requestState, setRequestState] =
    useState<RequestState>({
      requestKey: null,
      data: null,
      error: null,
    });

  useEffect(() => {
    if (!supported || !requestKey) {
      return;
    }

    const controller = new AbortController();

    async function loadEconomicData() {
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

        const result: unknown = await response.json();

        if (!response.ok) {
          throw new Error(getErrorMessage(result));
        }

        setRequestState({
          requestKey,
          data: result as EconomicDataResponse,
          error: null,
        });
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        setRequestState({
          requestKey,
          data: null,
          error:
            error instanceof Error
              ? error.message
              : "Erro desconhecido.",
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
    requestKey,
  ]);

  if (!supported || !requestKey) {
    return {
      data: null,
      isLoading: false,
      error: null,
      isSupported: false,
    };
  }

  const isCurrentRequest =
    requestState.requestKey === requestKey;

  return {
    data: isCurrentRequest
      ? requestState.data
      : null,
    isLoading: !isCurrentRequest,
    error: isCurrentRequest
      ? requestState.error
      : null,
    isSupported: true,
  };
}

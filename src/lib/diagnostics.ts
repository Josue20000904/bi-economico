import type {
  CompanyMetricKey,
  HistoricalPoint,
} from "@/data/historicalData";

export type DiagnosticTrend =
  | "growth"
  | "decline"
  | "stable";

export type DiagnosticSeverity =
  | "attention"
  | "critical";

export type DiagnosticAnomaly = {
  label: string;
  value: number;
  zScore: number;
  direction: "above" | "below";
  severity: DiagnosticSeverity;
};

export type DiagnosticVariation = {
  label: string;
  value: number;
  variationPercent: number;
};

export type MetricDiagnostics = {
  observations: number;
  firstValue: number;
  latestValue: number;
  average: number;
  standardDeviation: number;
  coefficientVariation: number;
  totalChangePercent: number;
  trend: DiagnosticTrend;
  anomalies: DiagnosticAnomaly[];
  largestIncrease: DiagnosticVariation | null;
  largestDrop: DiagnosticVariation | null;
};

function calculateAverage(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return (
    values.reduce((total, value) => total + value, 0) /
    values.length
  );
}

function calculateStandardDeviation(
  values: number[],
  average: number,
) {
  if (values.length === 0) {
    return 0;
  }

  const variance =
    values.reduce(
      (total, value) =>
        total + (value - average) ** 2,
      0,
    ) / values.length;

  return Math.sqrt(variance);
}

function calculateTrend(
  values: number[],
  average: number,
): DiagnosticTrend {
  if (values.length < 2) {
    return "stable";
  }

  const xAverage = (values.length - 1) / 2;

  const numerator = values.reduce(
    (total, value, index) =>
      total +
      (index - xAverage) * (value - average),
    0,
  );

  const denominator = values.reduce(
    (total, _, index) =>
      total + (index - xAverage) ** 2,
    0,
  );

  if (denominator === 0) {
    return "stable";
  }

  const slope = numerator / denominator;

  const normalizedSlope =
    average === 0 ? 0 : slope / Math.abs(average);

  if (normalizedSlope > 0.005) {
    return "growth";
  }

  if (normalizedSlope < -0.005) {
    return "decline";
  }

  return "stable";
}

export function analyzeMetricDiagnostics(
  historicalData: HistoricalPoint[],
  metric: CompanyMetricKey,
): MetricDiagnostics {
  const validData = historicalData.filter((point) =>
    Number.isFinite(Number(point[metric])),
  );

  const values = validData.map((point) =>
    Number(point[metric]),
  );

  if (values.length === 0) {
    return {
      observations: 0,
      firstValue: 0,
      latestValue: 0,
      average: 0,
      standardDeviation: 0,
      coefficientVariation: 0,
      totalChangePercent: 0,
      trend: "stable",
      anomalies: [],
      largestIncrease: null,
      largestDrop: null,
    };
  }

  const average = calculateAverage(values);

  const standardDeviation =
    calculateStandardDeviation(values, average);

  const coefficientVariation =
    average === 0
      ? 0
      : (standardDeviation / Math.abs(average)) * 100;

  const firstValue = values[0];
  const latestValue = values[values.length - 1];

  const totalChangePercent =
    firstValue === 0
      ? 0
      : ((latestValue - firstValue) /
          Math.abs(firstValue)) *
        100;

  const anomalies = validData
    .map((point) => {
      const value = Number(point[metric]);

      const zScore =
        standardDeviation === 0
          ? 0
          : (value - average) / standardDeviation;

      return {
        label: point.label,
        value,
        zScore,
        direction:
          zScore >= 0
            ? ("above" as const)
            : ("below" as const),
        severity:
          Math.abs(zScore) >= 2
            ? ("critical" as const)
            : ("attention" as const),
      };
    })
    .filter(
      (point) => Math.abs(point.zScore) >= 1.5,
    )
    .sort(
      (first, second) =>
        Math.abs(second.zScore) -
        Math.abs(first.zScore),
    );

  const variations: DiagnosticVariation[] =
    validData.slice(1).map((point, index) => {
      const previousValue = values[index];
      const currentValue = values[index + 1];

      const variationPercent =
        previousValue === 0
          ? 0
          : ((currentValue - previousValue) /
              Math.abs(previousValue)) *
            100;

      return {
        label: point.label,
        value: currentValue,
        variationPercent,
      };
    });

  const largestIncrease =
    variations.length === 0
      ? null
      : variations.reduce((largest, current) =>
          current.variationPercent >
          largest.variationPercent
            ? current
            : largest,
        );

  const largestDrop =
    variations.length === 0
      ? null
      : variations.reduce((largest, current) =>
          current.variationPercent <
          largest.variationPercent
            ? current
            : largest,
        );

  return {
    observations: values.length,
    firstValue,
    latestValue,
    average,
    standardDeviation,
    coefficientVariation,
    totalChangePercent,
    trend: calculateTrend(values, average),
    anomalies,
    largestIncrease,
    largestDrop,
  };
}

export function classifyVolatility(
  coefficientVariation: number,
) {
  if (coefficientVariation < 10) {
    return "Baixa";
  }

  if (coefficientVariation < 20) {
    return "Moderada";
  }

  if (coefficientVariation < 35) {
    return "Alta";
  }

  return "Muito alta";
}
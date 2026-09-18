import type {
  CompanyMetricKey,
  EconomicIndicatorKey,
  HistoricalPoint,
} from "@/data/historicalData";

export type RelationshipPoint = {
  label: string;
  x: number;
  y: number;
};

export type LagAnalysis = {
  lag: number;
  correlation: number;
  absoluteCorrelation: number;
  strength: string;
  direction: string;
  observations: number;
};

export type RegressionResult = {
  slope: number;
  intercept: number;
  rSquared: number;
};

export type RegressionLinePoint = {
  x: number;
  y: number;
};

function round(value: number, decimals = 3) {
  const multiplier = 10 ** decimals;

  return Math.round(value * multiplier) / multiplier;
}

export function pearsonCorrelation(
  xValues: number[],
  yValues: number[],
) {
  if (
    xValues.length !== yValues.length ||
    xValues.length < 2
  ) {
    return 0;
  }

  const observations = xValues.length;

  const xMean =
    xValues.reduce((total, value) => total + value, 0) /
    observations;

  const yMean =
    yValues.reduce((total, value) => total + value, 0) /
    observations;

  let numerator = 0;
  let xSquaredDifference = 0;
  let ySquaredDifference = 0;

  for (let index = 0; index < observations; index += 1) {
    const xDifference = xValues[index] - xMean;
    const yDifference = yValues[index] - yMean;

    numerator += xDifference * yDifference;
    xSquaredDifference += xDifference ** 2;
    ySquaredDifference += yDifference ** 2;
  }

  const denominator = Math.sqrt(
    xSquaredDifference * ySquaredDifference,
  );

  if (denominator === 0) {
    return 0;
  }

  return round(numerator / denominator);
}

export function createLaggedPairs(
  data: HistoricalPoint[],
  companyMetric: CompanyMetricKey,
  economicIndicator: EconomicIndicatorKey,
  lag: number,
): RelationshipPoint[] {
  const safeLag = Math.max(0, Math.floor(lag));

  return data
    .map((currentPoint, index) => {
      const economicIndex = index - safeLag;

      if (economicIndex < 0) {
        return null;
      }

      return {
        label: currentPoint.label,
        x: data[economicIndex][economicIndicator],
        y: currentPoint[companyMetric],
      };
    })
    .filter(
      (
        point,
      ): point is RelationshipPoint => point !== null,
    );
}

export function classifyCorrelation(correlation: number) {
  const absoluteCorrelation = Math.abs(correlation);

  let strength: string;

  if (absoluteCorrelation >= 0.7) {
    strength = "Forte";
  } else if (absoluteCorrelation >= 0.4) {
    strength = "Moderada";
  } else if (absoluteCorrelation >= 0.2) {
    strength = "Fraca";
  } else {
    strength = "Muito fraca";
  }

  const direction =
    correlation > 0
      ? "positiva"
      : correlation < 0
        ? "negativa"
        : "neutra";

  return {
    strength,
    direction,
    interpretation:
      direction === "neutra"
        ? strength
        : `${strength} ${direction}`,
  };
}

export function analyzeLags(
  data: HistoricalPoint[],
  companyMetric: CompanyMetricKey,
  economicIndicator: EconomicIndicatorKey,
  lags: number[] = [0, 1, 2, 4],
): LagAnalysis[] {
  return lags.map((lag) => {
    const points = createLaggedPairs(
      data,
      companyMetric,
      economicIndicator,
      lag,
    );

    const correlation = pearsonCorrelation(
      points.map((point) => point.x),
      points.map((point) => point.y),
    );

    const classification =
      classifyCorrelation(correlation);

    return {
      lag,
      correlation,
      absoluteCorrelation: Math.abs(correlation),
      strength: classification.strength,
      direction: classification.direction,
      observations: points.length,
    };
  });
}

export function findBestLag(
  lagAnalysis: LagAnalysis[],
) {
  if (lagAnalysis.length === 0) {
    return null;
  }

  return lagAnalysis.reduce((bestResult, result) =>
    result.absoluteCorrelation >
    bestResult.absoluteCorrelation
      ? result
      : bestResult,
  );
}

export function linearRegression(
  points: RelationshipPoint[],
): RegressionResult {
  if (points.length < 2) {
    return {
      slope: 0,
      intercept: 0,
      rSquared: 0,
    };
  }

  const xMean =
    points.reduce(
      (total, point) => total + point.x,
      0,
    ) / points.length;

  const yMean =
    points.reduce(
      (total, point) => total + point.y,
      0,
    ) / points.length;

  let numerator = 0;
  let denominator = 0;

  points.forEach((point) => {
    const xDifference = point.x - xMean;
    const yDifference = point.y - yMean;

    numerator += xDifference * yDifference;
    denominator += xDifference ** 2;
  });

  const slope =
    denominator === 0 ? 0 : numerator / denominator;

  const intercept = yMean - slope * xMean;

  const correlation = pearsonCorrelation(
    points.map((point) => point.x),
    points.map((point) => point.y),
  );

  return {
    slope: round(slope),
    intercept: round(intercept),
    rSquared: round(correlation ** 2),
  };
}

export function createRegressionLine(
  points: RelationshipPoint[],
  regression: RegressionResult,
): RegressionLinePoint[] {
  if (points.length === 0) {
    return [];
  }

  const xValues = points.map((point) => point.x);
  const minimumX = Math.min(...xValues);
  const maximumX = Math.max(...xValues);

  return [
    {
      x: minimumX,
      y: regression.slope * minimumX +
        regression.intercept,
    },
    {
      x: maximumX,
      y: regression.slope * maximumX +
        regression.intercept,
    },
  ];
}
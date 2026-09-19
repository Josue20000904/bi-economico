import type {
  CompanyMetricKey,
  EconomicIndicatorKey,
  HistoricalPoint,
} from "@/data/historicalData";

export type RelationshipPoint = { label: string; x: number; y: number };
export type LagAnalysis = {
  lag: number;
  correlation: number;
  absoluteCorrelation: number;
  strength: string;
  direction: string;
  observations: number;
  valid?: boolean;
};
export type RegressionResult = {
  slope: number;
  intercept: number;
  rSquared: number;
};
export type RegressionLinePoint = { x: number; y: number };

export type AnalysisOptions = {
  frequency?: "trimestral" | "anual";
  startYear?: number;
  endYear?: number;
};

function round(value: number, decimals = 3) {
  const multiplier = 10 ** decimals;
  return Math.round(value * multiplier) / multiplier;
}

function mean(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

// null distingue correlação indefinida de uma correlação realmente igual a zero.
function validPearson(xValues: number[], yValues: number[]): number | null {
  if (xValues.length !== yValues.length || xValues.length < 2) return null;
  if (!xValues.every(Number.isFinite) || !yValues.every(Number.isFinite)) return null;

  const xMean = mean(xValues);
  const yMean = mean(yValues);
  let numerator = 0;
  let xSquaredDifference = 0;
  let ySquaredDifference = 0;

  for (let index = 0; index < xValues.length; index += 1) {
    const xDifference = xValues[index] - xMean;
    const yDifference = yValues[index] - yMean;
    numerator += xDifference * yDifference;
    xSquaredDifference += xDifference ** 2;
    ySquaredDifference += yDifference ** 2;
  }

  const denominator = Math.sqrt(xSquaredDifference * ySquaredDifference);
  return denominator > 0 ? Math.max(-1, Math.min(1, numerator / denominator)) : null;
}

// Mantém a assinatura numérica usada por outras telas do projeto.
export function pearsonCorrelation(xValues: number[], yValues: number[]) {
  return round(validPearson(xValues, yValues) ?? 0);
}

function aggregateCompany(values: number[], metric: CompanyMetricKey) {
  if (metric === "receita" || metric === "ebitda" || metric === "lucro") {
    return values.reduce((sum, value) => sum + value, 0);
  }
  if (metric === "divida" || metric === "acao") return values.at(-1)!;
  // Coerente com a margem anual exibida na Visão Geral.
  return mean(values);
}

function aggregateEconomic(values: number[], indicator: EconomicIndicatorKey) {
  if (indicator === "ipca") {
    return (values.reduce((product, value) => product * (1 + value / 100), 1) - 1) * 100;
  }
  if (indicator === "selic" || indicator === "ibovespa") return values.at(-1)!;
  return mean(values);
}

export function createLaggedPairs(
  data: HistoricalPoint[],
  companyMetric: CompanyMetricKey,
  economicIndicator: EconomicIndicatorKey,
  lag: number,
  options: AnalysisOptions = {},
): RelationshipPoint[] {
  const safeLag = Number.isFinite(lag) ? Math.max(0, Math.floor(lag)) : 0;
  const pointsByQuarter = new Map<number, HistoricalPoint>(
    data.map((point) => [point.year * 4 + point.quarter - 1, point]),
  );
  const ordered = [...data].sort(
    (a, b) => a.year - b.year || a.quarter - b.quarter,
  );
  const quarterly = ordered.flatMap((point) => {
    if (options.startYear !== undefined && point.year < options.startYear) return [];
    if (options.endYear !== undefined && point.year > options.endYear) return [];
    const previous = pointsByQuarter.get(point.year * 4 + point.quarter - 1 - safeLag);
    if (!previous) return [];
    const x = previous[economicIndicator];
    const y = point[companyMetric];
    return Number.isFinite(x) && Number.isFinite(y)
      ? [{ label: point.label, x, y, year: point.year, quarter: point.quarter }]
      : [];
  });

  if (options.frequency !== "anual") {
    return quarterly.map(({ label, x, y }) => ({ label, x, y }));
  }

  const grouped = new Map<number, typeof quarterly>();
  for (const point of quarterly) {
    const points = grouped.get(point.year) ?? [];
    points.push(point);
    grouped.set(point.year, points);
  }

  return Array.from(grouped.entries()).flatMap(([year, points]) => {
    // Evita tratar um ano com trimestres ausentes como ano completo.
    if (points.length !== 4 || new Set(points.map((p) => p.quarter)).size !== 4) return [];
    return [{
      label: String(year),
      x: aggregateEconomic(points.map((p) => p.x), economicIndicator),
      y: aggregateCompany(points.map((p) => p.y), companyMetric),
    }];
  });
}

export function classifyCorrelation(correlation: number) {
  const magnitude = Math.abs(correlation);
  const strength = magnitude >= 0.7 ? "Forte" : magnitude >= 0.4
    ? "Moderada" : magnitude >= 0.2 ? "Fraca" : "Muito fraca";
  const direction = correlation > 0 ? "positiva" : correlation < 0 ? "negativa" : "neutra";
  return {
    strength,
    direction,
    interpretation: direction === "neutra" ? strength : `${strength} ${direction}`,
  };
}

export function analyzeLags(
  data: HistoricalPoint[],
  companyMetric: CompanyMetricKey,
  economicIndicator: EconomicIndicatorKey,
  lags: number[] = [0, 1, 2, 4],
  options: AnalysisOptions = {},
): LagAnalysis[] {
  const minimum = options.frequency === "anual" ? 5 : 8;
  return lags.map((lag) => {
    const points = createLaggedPairs(data, companyMetric, economicIndicator, lag, options);
    const rawCorrelation = validPearson(
      points.map((point) => point.x),
      points.map((point) => point.y),
    );
    const valid = points.length >= minimum && rawCorrelation !== null;
    const correlation = valid && rawCorrelation !== null ? round(rawCorrelation) : 0;
    const classification = classifyCorrelation(correlation);
    return {
      lag,
      correlation,
      absoluteCorrelation: Math.abs(correlation),
      strength: classification.strength,
      direction: classification.direction,
      observations: points.length,
      valid,
    };
  });
}

export function findBestLag(lagAnalysis: LagAnalysis[]) {
  const eligible = lagAnalysis.filter((result) =>
    result.valid !== false && result.observations >= 2 &&
    Number.isFinite(result.absoluteCorrelation),
  );
  if (eligible.length === 0) return null;
  return eligible.reduce((best, result) =>
    result.absoluteCorrelation > best.absoluteCorrelation ? result : best,
  );
}

export function linearRegression(points: RelationshipPoint[]): RegressionResult {
  if (points.length < 2) return { slope: 0, intercept: 0, rSquared: 0 };
  const x = points.map((point) => point.x);
  const y = points.map((point) => point.y);
  const correlation = validPearson(x, y);
  if (correlation === null) return { slope: 0, intercept: 0, rSquared: 0 };
  const xMean = mean(x);
  const yMean = mean(y);
  const denominator = x.reduce((sum, value) => sum + (value - xMean) ** 2, 0);
  const numerator = points.reduce((sum, point) =>
    sum + (point.x - xMean) * (point.y - yMean), 0,
  );
  const slope = numerator / denominator;
  return { slope, intercept: yMean - slope * xMean, rSquared: correlation ** 2 };
}

export function createRegressionLine(
  points: RelationshipPoint[],
  regression: RegressionResult,
): RegressionLinePoint[] {
  if (points.length < 2 || !points.every((point) =>
    Number.isFinite(point.x) && Number.isFinite(point.y))) return [];
  const xValues = points.map((point) => point.x);
  const minimumX = Math.min(...xValues);
  const maximumX = Math.max(...xValues);
  if (minimumX === maximumX) return [];
  return [
    { x: minimumX, y: regression.slope * minimumX + regression.intercept },
    { x: maximumX, y: regression.slope * maximumX + regression.intercept },
  ];
}

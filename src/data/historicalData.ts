export type CompanyMetricKey =
  | "receita"
  | "ebitda"
  | "lucro"
  | "margem"
  | "divida"
  | "acao";

export type EconomicIndicatorKey =
  | "selic"
  | "ipca"
  | "cambio"
  | "ibovespa"
  | "brent"
  | "desemprego";

export type HistoricalPoint = {
  label: string;
  year: number;
  quarter: number;
  receita: number;
  ebitda: number;
  lucro: number;
  margem: number;
  divida: number;
  acao: number;
  selic: number;
  ipca: number;
  cambio: number;
  ibovespa: number;
  brent: number;
  desemprego: number;
};

type MacroIndicators = {
  selic: number;
  ipca: number;
  cambio: number;
  ibovespa: number;
  brent: number;
  desemprego: number;
};

const macroByYear: Record<number, MacroIndicators> = {
  2019: {
    selic: 5.9,
    ipca: 4.3,
    cambio: 4.03,
    ibovespa: 115645,
    brent: 64,
    desemprego: 11.9,
  },
  2020: {
    selic: 2.8,
    ipca: 4.5,
    cambio: 5.20,
    ibovespa: 119017,
    brent: 42,
    desemprego: 13.5,
  },
  2021: {
    selic: 4.4,
    ipca: 10.1,
    cambio: 5.39,
    ibovespa: 104822,
    brent: 71,
    desemprego: 13.2,
  },
  2022: {
    selic: 12.4,
    ipca: 5.8,
    cambio: 5.16,
    ibovespa: 109735,
    brent: 101,
    desemprego: 9.3,
  },
  2023: {
    selic: 13.2,
    ipca: 4.6,
    cambio: 4.99,
    ibovespa: 134185,
    brent: 82,
    desemprego: 7.8,
  },
  2024: {
    selic: 10.9,
    ipca: 4.8,
    cambio: 5.39,
    ibovespa: 120283,
    brent: 81,
    desemprego: 6.9,
  },
  2025: {
    selic: 14.2,
    ipca: 5.1,
    cambio: 5.65,
    ibovespa: 128500,
    brent: 75,
    desemprego: 6.7,
  },
};

function round(value: number, decimals = 1) {
  const multiplier = 10 ** decimals;

  return Math.round(value * multiplier) / multiplier;
}

function getCompanyFactor(companyCode: string) {
  const codeTotal = companyCode
    .split("")
    .reduce(
      (total, character) =>
        total + character.charCodeAt(0),
      0,
    );

  return 0.75 + (codeTotal % 50) / 100;
}

export function createDemoHistoricalData(
  companyCode: string,
): HistoricalPoint[] {
  const companyFactor = getCompanyFactor(companyCode);

  return Array.from({ length: 28 }, (_, index) => {
    const year = 2019 + Math.floor(index / 4);
    const quarter = (index % 4) + 1;

    const macro = macroByYear[year];

    const seasonalEffect =
      Math.sin(index * 0.9) * 6 +
      Math.cos(index * 0.35) * 3;

    const pandemicEffect =
      year === 2020
        ? -14
        : year === 2021
          ? 7
          : 0;

    const baseRevenue =
      78 +
      index * 2.7 +
      seasonalEffect +
      pandemicEffect;

    const receita = Math.max(
      25,
      baseRevenue * companyFactor,
    );

    const ebitda =
      receita *
      (0.36 + Math.sin(index * 0.45) * 0.035);

    const lucro =
      receita *
      (0.18 + Math.cos(index * 0.52) * 0.03);

    const margem = (ebitda / receita) * 100;

    const divida =
      (96 -
        index * 0.75 +
        Math.sin(index * 0.5) * 8) *
      companyFactor;

    const acao =
      (24 +
        index * 0.8 +
        Math.sin(index * 0.7) * 4) *
      companyFactor;

    const quarterPosition = quarter - 2.5;

    return {
      label: `T${quarter}/${year}`,
      year,
      quarter,
      receita: round(receita),
      ebitda: round(ebitda),
      lucro: round(lucro),
      margem: round(margem),
      divida: round(Math.max(10, divida)),
      acao: round(Math.max(5, acao), 2),
      selic: round(
        macro.selic + quarterPosition * 0.15,
        2,
      ),
      ipca: round(
        macro.ipca + quarterPosition * 0.08,
        2,
      ),
      cambio: round(
        macro.cambio + quarterPosition * 0.04,
        2,
      ),
      ibovespa: Math.round(
        macro.ibovespa +
          quarterPosition * 1800 +
          Math.sin(index) * 2500,
      ),
      brent: round(
        macro.brent +
          quarterPosition * 2.5 +
          Math.sin(index * 0.8) * 5,
        2,
      ),
      desemprego: round(
        macro.desemprego -
          quarterPosition * 0.12,
        2,
      ),
    };
  });
}
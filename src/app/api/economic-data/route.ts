import { NextRequest, NextResponse } from "next/server";

type SupportedIndicator =
  | "selic"
  | "ipca"
  | "cambio";

type AggregationMethod =
  | "last"
  | "average"
  | "compound";

type BcbResponseItem = {
  data: string;
  valor: string;
};

type ParsedPoint = {
  timestamp: number;
  year: number;
  quarter: number;
  value: number;
};

const indicatorConfiguration: Record<
  SupportedIndicator,
  {
    seriesCode: number;
    label: string;
    unit: string;
    aggregation: AggregationMethod;
  }
> = {
  selic: {
    seriesCode: 432,
    label: "Meta Selic",
    unit: "% ao ano",
    aggregation: "last",
  },
  ipca: {
    seriesCode: 433,
    label: "IPCA",
    unit: "% no trimestre",
    aggregation: "compound",
  },
  cambio: {
    seriesCode: 1,
    label: "Dólar comercial",
    unit: "R$/US$",
    aggregation: "average",
  },
};

function isSupportedIndicator(
  indicator: string,
): indicator is SupportedIndicator {
  return indicator in indicatorConfiguration;
}

function parseBcbDate(date: string) {
  const [day, month, year] = date
    .split("/")
    .map(Number);

  return {
    timestamp: Date.UTC(year, month - 1, day),
    year,
    quarter: Math.ceil(month / 3),
  };
}

function parseBcbValue(value: string) {
  return Number(value.replace(",", "."));
}

function aggregateValues(
  points: ParsedPoint[],
  method: AggregationMethod,
) {
  if (points.length === 0) {
    return 0;
  }

  const orderedPoints = [...points].sort(
    (first, second) =>
      first.timestamp - second.timestamp,
  );

  if (method === "last") {
    return orderedPoints[orderedPoints.length - 1].value;
  }

  if (method === "compound") {
    return (
      (orderedPoints.reduce(
        (accumulator, point) =>
          accumulator * (1 + point.value / 100),
        1,
      ) -
        1) *
      100
    );
  }

  return (
    orderedPoints.reduce(
      (total, point) => total + point.value,
      0,
    ) / orderedPoints.length
  );
}

function roundValue(value: number) {
  return Math.round(value * 10000) / 10000;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const indicator =
      searchParams.get("indicator") ?? "selic";

    const startYear = Number(
      searchParams.get("startYear") ?? "2019",
    );

    const endYear = Number(
      searchParams.get("endYear") ?? "2025",
    );

    if (!isSupportedIndicator(indicator)) {
      return NextResponse.json(
        {
          error:
            "Indicador não suportado. Utilize selic, ipca ou cambio.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !Number.isInteger(startYear) ||
      !Number.isInteger(endYear)
    ) {
      return NextResponse.json(
        {
          error:
            "Os anos inicial e final precisam ser números inteiros.",
        },
        {
          status: 400,
        },
      );
    }

    if (startYear > endYear) {
      return NextResponse.json(
        {
          error:
            "O ano inicial não pode ser maior que o ano final.",
        },
        {
          status: 400,
        },
      );
    }

    if (endYear - startYear >= 10) {
      return NextResponse.json(
        {
          error:
            "A API do Banco Central aceita intervalos de até dez anos.",
        },
        {
          status: 400,
        },
      );
    }

    const configuration =
      indicatorConfiguration[indicator];

    const apiUrl = new URL(
      `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${configuration.seriesCode}/dados`,
    );

    apiUrl.searchParams.set("formato", "json");
    apiUrl.searchParams.set(
      "dataInicial",
      `01/01/${startYear}`,
    );
    apiUrl.searchParams.set(
      "dataFinal",
      `31/12/${endYear}`,
    );

    const response = await fetch(apiUrl.toString(), {
      headers: {
        Accept: "application/json",
      },
      next: {
        revalidate: 60 * 60 * 24,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Banco Central respondeu com status ${response.status}.`,
      );
    }

    const rawData =
      (await response.json()) as BcbResponseItem[];

    if (!Array.isArray(rawData)) {
      throw new Error(
        "A resposta do Banco Central não possui o formato esperado.",
      );
    }

    const parsedPoints: ParsedPoint[] = rawData
      .map((item) => {
        const parsedDate = parseBcbDate(item.data);
        const value = parseBcbValue(item.valor);

        return {
          ...parsedDate,
          value,
        };
      })
      .filter((point) =>
        Number.isFinite(point.value),
      );

    const groupedPoints = new Map<
      string,
      ParsedPoint[]
    >();

    parsedPoints.forEach((point) => {
      const key = `${point.year}-${point.quarter}`;

      const existingGroup =
        groupedPoints.get(key) ?? [];

      existingGroup.push(point);
      groupedPoints.set(key, existingGroup);
    });

    const quarterlyData = Array.from(
      groupedPoints.entries(),
    )
      .map(([key, points]) => {
        const [year, quarter] = key
          .split("-")
          .map(Number);

        const value = aggregateValues(
          points,
          configuration.aggregation,
        );

        return {
          label: `T${quarter}/${year}`,
          year,
          quarter,
          value: roundValue(value),
          observations: points.length,
        };
      })
      .sort(
        (first, second) =>
          first.year - second.year ||
          first.quarter - second.quarter,
      );

    return NextResponse.json({
      source: "Banco Central do Brasil - SGS",
      indicator,
      indicatorLabel: configuration.label,
      seriesCode: configuration.seriesCode,
      unit: configuration.unit,
      frequency: "quarterly",
      startYear,
      endYear,
      data: quarterlyData,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro desconhecido.";

    console.error(
      "Erro ao consultar o Banco Central:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível carregar os dados do Banco Central.",
        details: message,
      },
      {
        status: 502,
      },
    );
  }
}
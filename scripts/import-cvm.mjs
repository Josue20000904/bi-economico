import AdmZip from "adm-zip";
import { parse } from "csv-parse/sync";

import {
  access,
  mkdir,
  readFile,
  writeFile,
} from "node:fs/promises";

import { join } from "node:path";

const YEARS = [
  2019,
  2020,
  2021,
  2022,
  2023,
  2024,
  2025,
];

const COMPANY = {
  ticker: "PETR4",
  name: "Petrobras",
  cnpj: "33000167000101",
};

const CVM_BASE_URL =
  "https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC";

const PROJECT_ROOT = process.cwd();

const CACHE_DIRECTORY = join(
  PROJECT_ROOT,
  ".cache",
  "cvm",
);

const OUTPUT_DIRECTORY = join(
  PROJECT_ROOT,
  "src",
  "data",
  "generated",
);

const OUTPUT_FILE = join(
  OUTPUT_DIRECTORY,
  "petr4-financials.json",
);

const FLOW_ACCOUNTS = {
  receita: ["3.01"],
  lucro: ["3.11", "3.11.01"],
};

const DEBT_ACCOUNTS = [
  "2.01.04",
  "2.02.01",
];

function normalizeText(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

function normalizeCnpj(value = "") {
  return value.replace(/\D/g, "");
}

function parseCvmNumber(value = "") {
  const text = value.trim();

  if (!text) {
    return null;
  }

  const normalizedValue = text.includes(",")
    ? text.replace(/\./g, "").replace(",", ".")
    : text;

  const parsedValue = Number(normalizedValue);

  return Number.isFinite(parsedValue)
    ? parsedValue
    : null;
}

function getScaleMultiplier(scale = "") {
  const normalizedScale = normalizeText(scale);

  if (normalizedScale.includes("MILHAO")) {
    return 1_000_000;
  }

  if (normalizedScale === "MIL") {
    return 1_000;
  }

  return 1;
}

function getRowValueInReais(row) {
  const value = parseCvmNumber(row.VL_CONTA);

  if (value === null) {
    return null;
  }

  return (
    value * getScaleMultiplier(row.ESCALA_MOEDA)
  );
}

function parseIsoDate(value = "") {
  const [year, month, day] = value
    .split("-")
    .map(Number);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return null;
  }

  return {
    year,
    month,
    day,
  };
}

function isLatestExercise(row) {
  return normalizeText(row.ORDEM_EXERC) === "ULTIMO";
}

function isYearToDate(row) {
  const startDate = parseIsoDate(row.DT_INI_EXERC);
  const endDate = parseIsoDate(row.DT_FIM_EXERC);

  if (!startDate || !endDate) {
    return false;
  }

  return (
    startDate.year === endDate.year &&
    startDate.month === 1 &&
    startDate.day === 1
  );
}

function round(value, decimals = 4) {
  if (value === null) {
    return null;
  }

  const multiplier = 10 ** decimals;

  return Math.round(value * multiplier) / multiplier;
}

function toBillions(value) {
  if (value === null) {
    return null;
  }

  return round(value / 1_000_000_000);
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function getArchiveUrl(documentType, year) {
  const upperDocument = documentType.toUpperCase();

  return `${CVM_BASE_URL}/${upperDocument}/DADOS/${documentType}_cia_aberta_${year}.zip`;
}

async function downloadArchive(documentType, year) {
  await mkdir(CACHE_DIRECTORY, {
    recursive: true,
  });

  const cacheFile = join(
    CACHE_DIRECTORY,
    `${documentType}_cia_aberta_${year}.zip`,
  );

  if (await fileExists(cacheFile)) {
    console.log(
      `  Cache encontrado: ${documentType.toUpperCase()} ${year}`,
    );

    return readFile(cacheFile);
  }

  const url = getArchiveUrl(documentType, year);

  console.log(`  Baixando: ${url}`);

  const response = await fetch(url, {
    headers: {
      "User-Agent": "BI-Economico/1.0 contato-local",
      Accept: "application/zip",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Falha ao baixar ${documentType.toUpperCase()} ${year}: HTTP ${response.status}`,
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await writeFile(cacheFile, buffer);

  return buffer;
}

function findCsvEntry(
  zip,
  documentType,
  statement,
  year,
) {
  const expectedFileName =
    `${documentType}_cia_aberta_` +
    `${statement}_con_${year}.csv`;

  const entry = zip
    .getEntries()
    .find((currentEntry) =>
      currentEntry.entryName
        .toLowerCase()
        .endsWith(expectedFileName.toLowerCase()),
    );

  if (!entry) {
    throw new Error(
      `Arquivo ${expectedFileName} não encontrado no ZIP.`,
    );
  }

  return entry;
}

function readStatementRows(
  zip,
  documentType,
  statement,
  year,
  isFlowStatement,
) {
  const entry = findCsvEntry(
    zip,
    documentType,
    statement,
    year,
  );

  const csvContent = entry
    .getData()
    .toString("latin1");

  const rows = parse(csvContent, {
    columns: true,
    delimiter: ";",
    bom: true,
    skip_empty_lines: true,

    // Permite aspas dentro de campos não delimitados por aspas.
    relax_quotes: true,

    relax_column_count: true,
    trim: false,
  });

  const relevantAccounts =
    statement === "DRE"
      ? [
          ...FLOW_ACCOUNTS.receita,
          ...FLOW_ACCOUNTS.lucro,
        ]
      : DEBT_ACCOUNTS;

  const selectedRows = new Map();

  for (const row of rows) {
    if (
      normalizeCnpj(row.CNPJ_CIA) !== COMPANY.cnpj
    ) {
      continue;
    }

    if (!isLatestExercise(row)) {
      continue;
    }

    if (!relevantAccounts.includes(row.CD_CONTA)) {
      continue;
    }

    if (isFlowStatement && !isYearToDate(row)) {
      continue;
    }

    const key =
      `${row.DT_FIM_EXERC}|${row.CD_CONTA}`;

    const currentVersion = Number(row.VERSAO ?? 0);
    const existing = selectedRows.get(key);
    const existingVersion = Number(
      existing?.VERSAO ?? -1,
    );

    if (
      !existing ||
      currentVersion >= existingVersion
    ) {
      selectedRows.set(key, row);
    }
  }

  return Array.from(selectedRows.values());
}

function createSnapshots(rows) {
  const snapshots = new Map();

  for (const row of rows) {
    const value = getRowValueInReais(row);

    if (value === null) {
      continue;
    }

    const date = row.DT_FIM_EXERC;
    const accounts =
      snapshots.get(date) ?? new Map();

    accounts.set(row.CD_CONTA, value);
    snapshots.set(date, accounts);
  }

  return snapshots;
}

function findSnapshotForQuarter(
  snapshots,
  year,
  quarter,
) {
  const targetMonth = quarter * 3;

  const matchingDates = Array.from(snapshots.keys())
    .filter((date) => {
      const parsedDate = parseIsoDate(date);

      return (
        parsedDate?.year === year &&
        parsedDate?.month === targetMonth
      );
    })
    .sort();

  const selectedDate =
    matchingDates[matchingDates.length - 1];

  return selectedDate
    ? snapshots.get(selectedDate)
    : null;
}

function getPreferredAccountValue(
  accounts,
  accountOptions,
) {
  if (!accounts) {
    return null;
  }

  for (const account of accountOptions) {
    const value = accounts.get(account);

    if (value !== undefined) {
      return value;
    }
  }

  return null;
}

function getDebtValue(accounts) {
  if (!accounts) {
    return null;
  }

  const values = DEBT_ACCOUNTS
    .map((account) => accounts.get(account))
    .filter((value) => value !== undefined);

  if (values.length === 0) {
    return null;
  }

  return values.reduce(
    (total, value) => total + value,
    0,
  );
}

function calculateQuarterValues(cumulativeValues) {
  const quarterlyValues = new Map();

  let previousCumulativeValue = 0;

  for (
    let quarter = 1;
    quarter <= 4;
    quarter += 1
  ) {
    const cumulativeValue =
      cumulativeValues.get(quarter);

    if (cumulativeValue === null) {
      quarterlyValues.set(quarter, null);
      previousCumulativeValue = null;
      continue;
    }

    if (previousCumulativeValue === null) {
      quarterlyValues.set(quarter, null);
      previousCumulativeValue = cumulativeValue;
      continue;
    }

    quarterlyValues.set(
      quarter,
      cumulativeValue - previousCumulativeValue,
    );

    previousCumulativeValue = cumulativeValue;
  }

  return quarterlyValues;
}

function collectCumulativeValues(
  itrSnapshots,
  dfpSnapshots,
  year,
  accountOptions,
) {
  const values = new Map();

  for (
    let quarter = 1;
    quarter <= 3;
    quarter += 1
  ) {
    const accounts = findSnapshotForQuarter(
      itrSnapshots,
      year,
      quarter,
    );

    values.set(
      quarter,
      getPreferredAccountValue(
        accounts,
        accountOptions,
      ),
    );
  }

  const annualAccounts = findSnapshotForQuarter(
    dfpSnapshots,
    year,
    4,
  );

  values.set(
    4,
    getPreferredAccountValue(
      annualAccounts,
      accountOptions,
    ),
  );

  return values;
}

async function processYear(year) {
  console.log(`\nProcessando ${year}...`);

  const [itrArchive, dfpArchive] = await Promise.all([
    downloadArchive("itr", year),
    downloadArchive("dfp", year),
  ]);

  const itrZip = new AdmZip(itrArchive);
  const dfpZip = new AdmZip(dfpArchive);

  const itrDreRows = readStatementRows(
    itrZip,
    "itr",
    "DRE",
    year,
    true,
  );

  const dfpDreRows = readStatementRows(
    dfpZip,
    "dfp",
    "DRE",
    year,
    true,
  );

  const itrBppRows = readStatementRows(
    itrZip,
    "itr",
    "BPP",
    year,
    false,
  );

  const dfpBppRows = readStatementRows(
    dfpZip,
    "dfp",
    "BPP",
    year,
    false,
  );

  const itrDreSnapshots = createSnapshots(itrDreRows);
  const dfpDreSnapshots = createSnapshots(dfpDreRows);
  const itrBppSnapshots = createSnapshots(itrBppRows);
  const dfpBppSnapshots = createSnapshots(dfpBppRows);

  const cumulativeRevenue = collectCumulativeValues(
    itrDreSnapshots,
    dfpDreSnapshots,
    year,
    FLOW_ACCOUNTS.receita,
  );

  const cumulativeProfit = collectCumulativeValues(
    itrDreSnapshots,
    dfpDreSnapshots,
    year,
    FLOW_ACCOUNTS.lucro,
  );

  const quarterlyRevenue = calculateQuarterValues(
    cumulativeRevenue,
  );

  const quarterlyProfit = calculateQuarterValues(
    cumulativeProfit,
  );

  const points = [];

  for (
    let quarter = 1;
    quarter <= 4;
    quarter += 1
  ) {
    const revenue = quarterlyRevenue.get(quarter);
    const profit = quarterlyProfit.get(quarter);

    const debtAccounts =
      quarter === 4
        ? findSnapshotForQuarter(
            dfpBppSnapshots,
            year,
            quarter,
          )
        : findSnapshotForQuarter(
            itrBppSnapshots,
            year,
            quarter,
          );

    const debt = getDebtValue(debtAccounts);

    if (revenue === null && profit === null) {
      continue;
    }

    const margin =
      revenue && profit !== null
        ? (profit / revenue) * 100
        : null;

    points.push({
      label: `T${quarter}/${year}`,
      year,
      quarter,
      receita: toBillions(revenue),
      lucro: toBillions(profit),
      margem: round(margin, 2),
      divida: toBillions(debt),
      source:
        quarter === 4
          ? "CVM DFP"
          : "CVM ITR",
    });
  }

  console.log(
    `  ${points.length} trimestre(s) encontrado(s).`,
  );

  return points;
}

async function main() {
  console.log(
    `Importando dados da ${COMPANY.name} (${COMPANY.ticker})`,
  );

  const allPoints = [];

  for (const year of YEARS) {
    try {
      const yearPoints = await processYear(year);

      allPoints.push(...yearPoints);
    } catch (error) {
      console.error(
        `Erro ao processar ${year}:`,
        error instanceof Error
          ? error.message
          : error,
      );
    }
  }

  if (allPoints.length === 0) {
    throw new Error(
      "Nenhum dado financeiro foi encontrado.",
    );
  }

  allPoints.sort(
    (first, second) =>
      first.year - second.year ||
      first.quarter - second.quarter,
  );

  await mkdir(OUTPUT_DIRECTORY, {
    recursive: true,
  });

  const output = {
    company: COMPANY,
    source: "Comissão de Valores Mobiliários - CVM",
    documents: ["ITR", "DFP"],
    generatedAt: new Date().toISOString(),
    metrics: [
      "receita",
      "lucro",
      "margem",
      "divida",
    ],
    data: allPoints,
  };

  await writeFile(
    OUTPUT_FILE,
    `${JSON.stringify(output, null, 2)}\n`,
    "utf8",
  );

  console.log("\nArquivo gerado com sucesso:");
  console.log(OUTPUT_FILE);

  console.log(
    `Total de observações: ${allPoints.length}`,
  );
}

main().catch((error) => {
  console.error("\nFalha no ETL:");

  console.error(
    error instanceof Error
      ? error.message
      : error,
  );

  process.exitCode = 1;
});
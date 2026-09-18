import type { FilterOption } from "@/types/dashboard";

export const segmentOptions: FilterOption[] = [
  { value: "energia", label: "Petróleo e Energia" },
  { value: "bancos", label: "Bancos e Serviços Financeiros" },
  { value: "mineracao", label: "Mineração e Siderurgia" },
  { value: "varejo", label: "Varejo" },
  { value: "alimentos", label: "Alimentos e Bebidas" },
];

export const companyOptionsBySegment: Record<string, FilterOption[]> = {
  energia: [
    { value: "PETR4", label: "Petrobras" },
    { value: "VBBR3", label: "Vibra Energia" },
    { value: "RAIZ4", label: "Raízen" },
  ],
  bancos: [
    { value: "ITUB4", label: "Itaú Unibanco" },
    { value: "BBAS3", label: "Banco do Brasil" },
    { value: "SANB11", label: "Santander Brasil" },
    { value: "BPAC11", label: "BTG Pactual" },
  ],
  mineracao: [
    { value: "VALE3", label: "Vale" },
    { value: "GGBR4", label: "Gerdau" },
    { value: "CSNA3", label: "CSN" },
  ],
  varejo: [
    { value: "MGLU3", label: "Magazine Luiza" },
    { value: "LREN3", label: "Lojas Renner" },
    { value: "ASAI3", label: "Assaí" },
  ],
  alimentos: [
    { value: "JBSS3", label: "JBS" },
    { value: "BRFS3", label: "BRF" },
    { value: "MRFG3", label: "Marfrig" },
  ],
};

export const periodOptions: FilterOption[] = [
  { value: "2019-2025", label: "2019 a 2025" },
  { value: "2021-2025", label: "2021 a 2025" },
  { value: "2023-2025", label: "2023 a 2025" },
  { value: "2025", label: "Somente 2025" },
];

export const companyMetricOptions: FilterOption[] = [
  { value: "receita", label: "Receita líquida" },
  { value: "ebitda", label: "EBITDA" },
  { value: "lucro", label: "Lucro líquido" },
  { value: "margem", label: "Margem líquida" },
  { value: "divida", label: "Dívida líquida" },
  { value: "acao", label: "Preço da ação" },
];

export const economicIndicatorOptions: FilterOption[] = [
  { value: "selic", label: "Taxa Selic" },
  { value: "ipca", label: "Inflação — IPCA" },
  { value: "cambio", label: "Câmbio — USD/BRL" },
  { value: "ibovespa", label: "Ibovespa" },
  { value: "brent", label: "Petróleo Brent" },
  { value: "desemprego", label: "Taxa de desemprego" },
];

export const lagOptions: FilterOption[] = [
  { value: "automatico", label: "Defasagem automática" },
  { value: "0", label: "Sem defasagem" },
  { value: "1", label: "1 trimestre" },
  { value: "2", label: "2 trimestres" },
  { value: "4", label: "4 trimestres" },
];

export const frequencyOptions: FilterOption[] = [
  { value: "trimestral", label: "Trimestral" },
  { value: "anual", label: "Anual" },
];
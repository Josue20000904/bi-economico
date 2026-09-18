import {
  BadgeDollarSign,
  ChartColumnIncreasing,
  CircleDollarSign,
  Percent,
} from "lucide-react";

import { KpiCard } from "@/components/ui/KpiCard";

import {
  companyOptionsBySegment,
  periodOptions,
} from "@/data/dashboardOptions";

import type { DashboardFiltersState } from "@/types/dashboard";

type OverviewPanelProps = {
  filters: DashboardFiltersState;
};

const demonstrationKpis = [
  {
    title: "Receita líquida",
    value: "R$ 124,6 bi",
    change: "8,4%",
    description: "Variação em relação ao período anterior.",
    trend: "up" as const,
    icon: BadgeDollarSign,
  },
  {
    title: "EBITDA",
    value: "R$ 52,1 bi",
    change: "5,7%",
    description: "Resultado operacional antes dos principais ajustes.",
    trend: "up" as const,
    icon: ChartColumnIncreasing,
  },
  {
    title: "Lucro líquido",
    value: "R$ 26,8 bi",
    change: "3,2%",
    description: "Variação em relação ao período anterior.",
    trend: "down" as const,
    icon: CircleDollarSign,
  },
  {
    title: "Margem EBITDA",
    value: "41,8%",
    change: "1,1 p.p.",
    description: "Participação do EBITDA sobre a receita líquida.",
    trend: "down" as const,
    icon: Percent,
  },
];

export function OverviewPanel({
  filters,
}: OverviewPanelProps) {
  const companyLabel =
    companyOptionsBySegment[filters.segment]?.find(
      (company) => company.value === filters.company,
    )?.label ?? filters.company;

  const periodLabel =
    periodOptions.find(
      (period) => period.value === filters.period,
    )?.label ?? filters.period;

  return (
    <section>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">
            Visão geral
          </p>

          <h3 className="mt-2 text-xl font-semibold text-white">
            {companyLabel}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Indicadores selecionados para o período de {periodLabel}.
          </p>
        </div>

        <span className="self-start rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs text-amber-300 sm:self-auto">
          Dados simulados para desenvolvimento
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {demonstrationKpis.map((kpi) => (
          <KpiCard
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            change={kpi.change}
            description={kpi.description}
            trend={kpi.trend}
            icon={kpi.icon}
          />
        ))}
      </div>
    </section>
  );
}
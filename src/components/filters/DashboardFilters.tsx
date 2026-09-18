"use client";

import {
  ChevronDown,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";

import {
  companyMetricOptions,
  companyOptionsBySegment,
  economicIndicatorOptions,
  frequencyOptions,
  lagOptions,
  periodOptions,
  segmentOptions,
} from "@/data/dashboardOptions";

import type {
  DashboardFiltersState,
  FilterOption,
} from "@/types/dashboard";

type DashboardFiltersProps = {
  filters: DashboardFiltersState;
  onChange: (filters: DashboardFiltersState) => void;
  onReset: () => void;
};

type FilterSelectProps = {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
};

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: FilterSelectProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
      </span>

      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full appearance-none rounded-xl border border-white/10 bg-[#091525] px-3 py-3 pr-9 text-sm text-slate-100 outline-none transition hover:border-amber-400/30 focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/10"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
        />
      </div>
    </label>
  );
}

export function DashboardFilters({
  filters,
  onChange,
  onReset,
}: DashboardFiltersProps) {
  const companyOptions =
    companyOptionsBySegment[filters.segment] ?? [];

  function updateFilter(
    field: keyof DashboardFiltersState,
    value: string,
  ) {
    if (field === "segment") {
      const firstCompany =
        companyOptionsBySegment[value]?.[0]?.value ?? "";

      onChange({
        ...filters,
        segment: value,
        company: firstCompany,
      });

      return;
    }

    onChange({
      ...filters,
      [field]: value,
    });
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-[#07111f] p-5 shadow-2xl shadow-black/10">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400/10 text-amber-400">
            <SlidersHorizontal size={18} />
          </div>

          <div>
            <h3 className="font-semibold text-white">
              Parâmetros da análise
            </h3>

            <p className="text-sm text-slate-500">
              Personalize a empresa, o período e a relação econômica.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-2 self-start rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white sm:self-auto"
        >
          <RotateCcw size={15} />
          Restaurar filtros
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-7">
        <FilterSelect
          label="Segmento"
          value={filters.segment}
          options={segmentOptions}
          onChange={(value) =>
            updateFilter("segment", value)
          }
        />

        <FilterSelect
          label="Empresa"
          value={filters.company}
          options={companyOptions}
          onChange={(value) =>
            updateFilter("company", value)
          }
        />

        <FilterSelect
          label="Período"
          value={filters.period}
          options={periodOptions}
          onChange={(value) =>
            updateFilter("period", value)
          }
        />

        <FilterSelect
          label="Métrica analisada"
          value={filters.companyMetric}
          options={companyMetricOptions}
          onChange={(value) =>
            updateFilter("companyMetric", value)
          }
        />

        <FilterSelect
          label="Relacionar com"
          value={filters.economicIndicator}
          options={economicIndicatorOptions}
          onChange={(value) =>
            updateFilter("economicIndicator", value)
          }
        />

        <FilterSelect
          label="Defasagem"
          value={filters.lag}
          options={lagOptions}
          onChange={(value) =>
            updateFilter("lag", value)
          }
        />

        <FilterSelect
          label="Frequência"
          value={filters.frequency}
          options={frequencyOptions}
          onChange={(value) =>
            updateFilter("frequency", value)
          }
        />
      </div>
    </section>
  );
}
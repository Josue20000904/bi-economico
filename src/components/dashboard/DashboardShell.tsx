"use client";

import { useState } from "react";

import { DiagnosticsPanel } from "@/components/dashboard/DiagnosticsPanel";
import { OverviewPanel } from "@/components/dashboard/OverviewPanel";
import { RelationshipPanel } from "@/components/dashboard/RelationshipPanel";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { DashboardFilters } from "@/components/filters/DashboardFilters";

import type {
  DashboardFiltersState,
  DashboardView,
} from "@/types/dashboard";

const initialFilters: DashboardFiltersState = {
  segment: "energia",
  company: "PETR4",
  period: "2019-2025",
  startYear: "2019",
  endYear: "2025",
  companyMetric: "receita",
  economicIndicator: "selic",
  lag: "automatico",
  frequency: "trimestral",
};

export function DashboardShell() {
  const [filters, setFilters] =
    useState<DashboardFiltersState>(initialFilters);

  const [activeView, setActiveView] =
    useState<DashboardView>("overview");

  function resetFilters() {
    setFilters(initialFilters);
  }

  return (
    <section className="mx-auto max-w-[1600px] px-6 py-6 sm:px-8 lg:py-7">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
            Painel econômico interativo
          </p>

          <h2 className="mt-2 max-w-3xl text-2xl font-semibold tracking-tight text-white md:text-3xl">
            Explore o desempenho das empresas e suas relações com a
            economia.
          </h2>
        </div>

        <p className="max-w-xl text-sm leading-6 text-slate-400 lg:pb-0.5 lg:text-right">
          Selecione empresas, períodos e indicadores econômicos
          para investigar padrões históricos, relações e mudanças
          de comportamento.
        </p>
      </div>

      <div className="mt-5">
        <DashboardFilters
          filters={filters}
          onChange={setFilters}
          onReset={resetFilters}
        />
      </div>

      <div className="mt-4">
        <DashboardTabs
          activeView={activeView}
          onChange={setActiveView}
        />
      </div>

      <div className="mt-5">
        {activeView === "overview" ? (
          <OverviewPanel filters={filters} />
        ) : activeView === "relations" ? (
          <RelationshipPanel filters={filters} />
        ) : (
          <DiagnosticsPanel filters={filters} />
        )}
      </div>
    </section>
  );
}

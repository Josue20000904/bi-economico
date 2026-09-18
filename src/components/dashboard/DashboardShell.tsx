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
    <section className="mx-auto max-w-[1600px] px-6 py-10 sm:px-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
          Painel econômico interativo
        </p>

        <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-white md:text-4xl">
          Explore o desempenho das empresas e suas relações com a
          economia.
        </h2>

        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400">
          Selecione empresas, períodos e indicadores econômicos
          para investigar padrões históricos, relações e mudanças
          de comportamento.
        </p>
      </div>

      <div className="mt-8">
        <DashboardFilters
          filters={filters}
          onChange={setFilters}
          onReset={resetFilters}
        />
      </div>

      <div className="mt-6">
        <DashboardTabs
          activeView={activeView}
          onChange={setActiveView}
        />
      </div>

      <div className="mt-6">
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
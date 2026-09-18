"use client";

import { useState } from "react";

import { DashboardFilters } from "@/components/filters/DashboardFilters";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { OverviewPanel } from "@/components/dashboard/OverviewPanel";

import type {
  DashboardFiltersState,
  DashboardView,
} from "@/types/dashboard";

const initialFilters: DashboardFiltersState = {
  segment: "energia",
  company: "PETR4",
  period: "2019-2025",
  companyMetric: "receita",
  economicIndicator: "selic",
  lag: "automatico",
};

const viewContent: Record<
  DashboardView,
  {
    eyebrow: string;
    title: string;
    description: string;
  }
> = {
  overview: {
    eyebrow: "Visão geral",
    title: "Resumo do desempenho selecionado",
    description:
      "Acompanhe os principais indicadores e a evolução histórica da empresa.",
  },
  relations: {
    eyebrow: "Laboratório de relações",
    title: "Investigue relações entre indicadores",
    description:
      "Compare o resultado da empresa com variáveis econômicas e teste diferentes defasagens.",
  },
  diagnostics: {
    eyebrow: "Diagnóstico",
    title: "Encontre padrões e mudanças relevantes",
    description:
      "Explore anomalias, sazonalidade, alterações de comportamento e possíveis explicações.",
  },
};

export function DashboardShell() {
  const [filters, setFilters] =
    useState<DashboardFiltersState>(initialFilters);

  const [activeView, setActiveView] =
    useState<DashboardView>("overview");

  const currentView = viewContent[activeView];

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
          Explore o desempenho das empresas e suas relações com a economia.
        </h2>

        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400">
          Selecione empresas, períodos e indicadores econômicos para
          investigar padrões históricos, relações e mudanças de
          comportamento.
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
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-[#07111f]/60 p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">
              {currentView.eyebrow}
            </p>

            <h3 className="mt-2 text-xl font-semibold text-white">
              {currentView.title}
            </h3>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              {currentView.description}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
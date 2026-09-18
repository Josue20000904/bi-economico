"use client";

import {
  ChartNoAxesCombined,
  GitCompareArrows,
  ScanSearch,
} from "lucide-react";

import type { DashboardView } from "@/types/dashboard";

type DashboardTabsProps = {
  activeView: DashboardView;
  onChange: (view: DashboardView) => void;
};

const views = [
  {
    id: "overview" as const,
    label: "Visão Geral",
    description: "KPIs e evolução histórica",
    icon: ChartNoAxesCombined,
  },
  {
    id: "relations" as const,
    label: "Explorar Relações",
    description: "Indicadores, correlação e defasagem",
    icon: GitCompareArrows,
  },
  {
    id: "diagnostics" as const,
    label: "Diagnóstico",
    description: "Padrões, anomalias e mudanças",
    icon: ScanSearch,
  },
];

export function DashboardTabs({
  activeView,
  onChange,
}: DashboardTabsProps) {
  return (
    <nav
      aria-label="Modos de análise"
      className="grid grid-cols-1 gap-3 md:grid-cols-3"
    >
      {views.map((view) => {
        const Icon = view.icon;
        const isActive = activeView === view.id;

        return (
          <button
            key={view.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(view.id)}
            className={`flex items-center gap-3 rounded-xl border px-4 py-4 text-left transition ${
              isActive
                ? "border-amber-400/40 bg-amber-400/10"
                : "border-white/10 bg-[#07111f] hover:border-white/20 hover:bg-white/[0.03]"
            }`}
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                isActive
                  ? "bg-amber-400 text-[#07111f]"
                  : "bg-white/5 text-slate-400"
              }`}
            >
              <Icon size={19} />
            </div>

            <div>
              <span
                className={`block text-sm font-semibold ${
                  isActive ? "text-amber-300" : "text-slate-200"
                }`}
              >
                {view.label}
              </span>

              <span className="mt-1 block text-xs text-slate-500">
                {view.description}
              </span>
            </div>
          </button>
        );
      })}
    </nav>
  );
}
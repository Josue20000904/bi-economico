import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050b14] text-slate-100">
      <DashboardHeader />

      <section className="mx-auto max-w-[1600px] px-6 py-10 sm:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
          Painel econômico interativo
        </p>

        <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-white md:text-4xl">
          Explore o desempenho das empresas e suas relações com a economia.
        </h2>

        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400">
          Selecione empresas, períodos e indicadores econômicos para investigar
          padrões históricos, relações e mudanças de comportamento.
        </p>
      </section>
    </main>
  );
}
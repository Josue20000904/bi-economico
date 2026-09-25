import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050b14] text-slate-100">
      <DashboardHeader />
      <DashboardShell />

      <footer className="border-t border-white/10 bg-[#07111f]">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-5 px-6 py-8 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold tracking-tight text-white">
              BI.<span className="text-amber-400">ECONÔMICO</span>
            </p>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Projeto de portfólio desenvolvido para demonstrar análise de
              dados, visualização interativa e aplicação de métodos estatísticos
              em informações econômicas e empresariais.
            </p>
          </div>

          <div className="max-w-2xl text-sm leading-6 text-slate-500 lg:text-right">
            <p>
              Fontes públicas utilizadas: CVM e Banco Central do Brasil. Séries
              simuladas são identificadas na interface.
            </p>

            <p className="mt-1">
              Conteúdo educacional e informativo. Não constitui recomendação de
              investimento.
            </p>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 lg:justify-end">
              <a
                href="https://github.com/Josue20000904/bi-economico"
                target="_blank"
                rel="noreferrer"
                className="text-slate-300 transition-colors hover:text-amber-400"
              >
                Código no GitHub
              </a>

              <span aria-hidden="true">•</span>
              <span>© 2026 Josue Honório</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

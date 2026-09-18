import { ChartLine, CircleCheck } from "lucide-react";

export function DashboardHeader() {
  return (
    <header className="border-b border-white/10 bg-[#07111f]">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-6 py-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10 text-amber-400">
            <ChartLine size={24} />
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              BI.<span className="text-amber-400">ECONÔMICO</span>
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Inteligência econômica orientada por dados
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300 lg:self-auto">
          <CircleCheck size={16} />
          <span>Painel gratuito</span>
        </div>
      </div>
    </header>
  );
}

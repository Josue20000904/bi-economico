import {
  ArrowDownRight,
  ArrowUpRight,
  Minus,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

type KpiCardProps = {
  title: string;
  value: string;
  change: string;
  description: string;
  trend: "up" | "down" | "neutral";
  icon: LucideIcon;
};

const trendStyles = {
  up: {
    color: "text-emerald-400",
    background: "bg-emerald-400/10",
    icon: ArrowUpRight,
  },
  down: {
    color: "text-rose-400",
    background: "bg-rose-400/10",
    icon: ArrowDownRight,
  },
  neutral: {
    color: "text-slate-400",
    background: "bg-slate-400/10",
    icon: Minus,
  },
};

export function KpiCard({
  title,
  value,
  change,
  description,
  trend,
  icon: Icon,
}: KpiCardProps) {
  const trendConfig = trendStyles[trend];
  const TrendIcon = trendConfig.icon;

  return (
    <article className="rounded-2xl border border-white/10 bg-[#07111f] p-5 transition hover:-translate-y-0.5 hover:border-white/20">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400">
          <Icon size={19} />
        </div>

        <div
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${trendConfig.color} ${trendConfig.background}`}
        >
          <TrendIcon size={14} />
          {change}
        </div>
      </div>

      <p className="mt-5 text-sm text-slate-400">{title}</p>

      <p className="mt-1 text-2xl font-semibold tracking-tight text-white">
        {value}
      </p>

      <p className="mt-3 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </article>
  );
}
"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { createRegressionLine, linearRegression } from "@/lib/analytics";
import type { RelationshipPoint } from "@/lib/analytics";

export type RelationshipScatterPoint = RelationshipPoint;

type RelationshipScatterChartProps = {
  points: RelationshipScatterPoint[];
  xLabel: string;
  yLabel: string;
};

type TooltipPayloadItem = { payload?: RelationshipScatterPoint };
type ScatterTooltipProps = {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  xLabel: string;
  yLabel: string;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 2,
  }).format(value);
}

function ScatterTooltip({ active, payload, xLabel, yLabel }: ScatterTooltipProps) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-[#07111f] px-4 py-3 shadow-2xl">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
        {point.label}
      </p>
      <p className="text-sm text-slate-300">
        {xLabel}: <span className="font-semibold text-white">{formatNumber(point.x)}</span>
      </p>
      <p className="mt-1 text-sm text-slate-300">
        {yLabel}: <span className="font-semibold text-white">{formatNumber(point.y)}</span>
      </p>
    </div>
  );
}

export function RelationshipScatterChart({
  points,
  xLabel,
  yLabel,
}: RelationshipScatterChartProps) {
  const regressionLine = useMemo(() =>
    createRegressionLine(points, linearRegression(points)), [points],
  );

  if (points.length < 2) {
    return (
      <div className="flex min-h-80 items-center justify-center rounded-2xl border border-white/10 bg-[#07111f] p-6">
        <p className="text-sm text-slate-500">
          Não há pares suficientes para gerar o gráfico de dispersão.
        </p>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-[#07111f] p-5">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">
          Gráfico de dispersão
        </p>
        <h3 className="mt-2 text-lg font-semibold text-white">
          {yLabel} × {xLabel}
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Cada ponto representa um par válido. A linha mostra o ajuste linear
          dos pontos exibidos.
        </p>
      </div>

      <div className="h-[420px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 25, bottom: 30, left: 10 }}>
            <CartesianGrid stroke="#1e293b" strokeDasharray="4 4" />
            <XAxis
              type="number"
              dataKey="x"
              name={xLabel}
              stroke="#64748b"
              tick={{ fill: "#64748b", fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "#1e293b" }}
              tickFormatter={formatNumber}
              label={{
                value: xLabel,
                position: "insideBottom",
                offset: -18,
                fill: "#94a3b8",
                fontSize: 12,
              }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={yLabel}
              stroke="#64748b"
              tick={{ fill: "#64748b", fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "#1e293b" }}
              tickFormatter={formatNumber}
              label={{
                value: yLabel,
                angle: -90,
                position: "insideLeft",
                fill: "#94a3b8",
                fontSize: 12,
              }}
            />
            <ZAxis range={[75, 75]} />
            <Tooltip
              cursor={{ stroke: "#475569", strokeDasharray: "4 4" }}
              content={<ScatterTooltip xLabel={xLabel} yLabel={yLabel} />}
            />
            {regressionLine.length === 2 && (
              <ReferenceLine
                segment={[regressionLine[0], regressionLine[1]]}
                stroke="#fbbf24"
                strokeWidth={2}
                strokeDasharray="7 5"
              />
            )}
            <Scatter name="Observações" data={points} fill="#38bdf8" fillOpacity={0.85} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex flex-wrap gap-5 text-xs text-slate-400">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-sky-400" /> Observações
        </span>
        {regressionLine.length === 2 && (
          <span className="flex items-center gap-2">
            <span className="h-0.5 w-6 border-t-2 border-dashed border-amber-400" />
            Tendência linear
          </span>
        )}
      </div>
    </section>
  );
}

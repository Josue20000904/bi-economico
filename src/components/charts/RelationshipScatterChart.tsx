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

export type RelationshipScatterPoint = {
  x: number;
  y: number;
  label: string;
};

type RelationshipScatterChartProps = {
  points: RelationshipScatterPoint[];
  xLabel: string;
  yLabel: string;
};

type TooltipPayloadItem = {
  payload?: RelationshipScatterPoint;
};

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

function ScatterTooltip({
  active,
  payload,
  xLabel,
  yLabel,
}: ScatterTooltipProps) {
  const point = payload?.[0]?.payload;

  if (!active || !point) {
    return null;
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#07111f] px-4 py-3 shadow-2xl">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
        {point.label}
      </p>

      <p className="text-sm text-slate-300">
        {xLabel}:{" "}
        <span className="font-semibold text-white">
          {formatNumber(point.x)}
        </span>
      </p>

      <p className="mt-1 text-sm text-slate-300">
        {yLabel}:{" "}
        <span className="font-semibold text-white">
          {formatNumber(point.y)}
        </span>
      </p>
    </div>
  );
}

function calculateRegressionLine(
  points: RelationshipScatterPoint[],
) {
  if (points.length < 2) {
    return null;
  }

  const total = points.length;

  const sumX = points.reduce(
    (sum, point) => sum + point.x,
    0,
  );

  const sumY = points.reduce(
    (sum, point) => sum + point.y,
    0,
  );

  const sumXY = points.reduce(
    (sum, point) => sum + point.x * point.y,
    0,
  );

  const sumXSquare = points.reduce(
    (sum, point) => sum + point.x ** 2,
    0,
  );

  const denominator =
    total * sumXSquare - sumX ** 2;

  if (denominator === 0) {
    return null;
  }

  const slope =
    (total * sumXY - sumX * sumY) / denominator;

  const intercept =
    (sumY - slope * sumX) / total;

  const xValues = points.map((point) => point.x);
  const minimumX = Math.min(...xValues);
  const maximumX = Math.max(...xValues);

  return {
    start: {
      x: minimumX,
      y: slope * minimumX + intercept,
    },
    end: {
      x: maximumX,
      y: slope * maximumX + intercept,
    },
  };
}

export function RelationshipScatterChart({
  points,
  xLabel,
  yLabel,
}: RelationshipScatterChartProps) {
  const regressionLine = useMemo(
    () => calculateRegressionLine(points),
    [points],
  );

  if (points.length === 0) {
    return (
      <div className="flex min-h-80 items-center justify-center rounded-2xl border border-white/10 bg-[#07111f] p-6">
        <p className="text-sm text-slate-500">
          Não existem observações suficientes para gerar o gráfico.
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
          Cada ponto representa uma observação do período selecionado.
          A linha indica a tendência linear estimada.
        </p>
      </div>

      <div className="h-[420px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{
              top: 20,
              right: 25,
              bottom: 30,
              left: 10,
            }}
          >
            <CartesianGrid
              stroke="#1e293b"
              strokeDasharray="4 4"
            />

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
              cursor={{
                stroke: "#475569",
                strokeDasharray: "4 4",
              }}
              content={
                <ScatterTooltip
                  xLabel={xLabel}
                  yLabel={yLabel}
                />
              }
            />

            {regressionLine && (
              <ReferenceLine
                segment={[
                  regressionLine.start,
                  regressionLine.end,
                ]}
                stroke="#fbbf24"
                strokeWidth={2}
                strokeDasharray="7 5"
              />
            )}

            <Scatter
              name="Observações"
              data={points}
              fill="#38bdf8"
              fillOpacity={0.85}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex flex-wrap gap-5 text-xs text-slate-400">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
          Observações
        </span>

        <span className="flex items-center gap-2">
          <span className="h-0.5 w-6 border-t-2 border-dashed border-amber-400" />
          Tendência linear
        </span>
      </div>
    </section>
  );
}
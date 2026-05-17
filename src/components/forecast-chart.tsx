"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { scenarioLabel } from "@/lib/format";
import type { ForecastScenario } from "@/lib/types";

type ForecastChartProps = {
  data: ForecastScenario[];
};

export function ForecastChart({ data }: ForecastChartProps) {
  const { ref: chartRef, width: chartWidth } = useChartWidth();
  const chartData = data.map((scenario) => ({
    ...scenario,
    label: scenarioLabel(scenario.name),
  }));

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-950">Сценарное сравнение</h2>
      <div ref={chartRef} className="mt-4 h-80 min-w-0">
        {chartWidth > 0 ? (
          <BarChart data={chartData} width={chartWidth} height={320}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="ordersQty" name="Заказы" fill="#0891b2" radius={[4, 4, 0, 0]} />
            <Bar dataKey="buyoutQty" name="Выкупы" fill="#0f766e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="projectScore" name="Итоговая оценка" fill="#475569" radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : (
          <div className="h-80 animate-pulse rounded-md bg-slate-100" />
        )}
      </div>
    </section>
  );
}

function useChartWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.max(1, Math.floor(entry.contentRect.width)));
    });
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return { ref, width };
}

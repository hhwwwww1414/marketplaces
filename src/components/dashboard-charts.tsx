"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type DashboardChartsProps = {
  dailySeries: Array<{ date: string; ordersQty: number; netRevenue: number; buyoutRate: number }>;
  marketplaceBreakdown: Array<{
    marketplace: string;
    ordersQty: number;
    buyoutQty: number;
    netRevenue: number;
    cancellationRate: number;
  }>;
};

export function DashboardCharts({ dailySeries, marketplaceBreakdown }: DashboardChartsProps) {
  const { ref: dailyRef, width: dailyWidth } = useChartWidth();
  const { ref: marketplaceRef, width: marketplaceWidth } = useChartWidth();
  const marketplaceData = marketplaceBreakdown.map((item) => ({
    ...item,
    label: item.marketplace === "ozon" ? "Ozon" : "Wildberries",
  }));

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">Динамика заказов и выручки</h2>
        <div ref={dailyRef} className="mt-4 h-80 min-w-0">
          {dailyWidth > 0 ? (
            <LineChart data={dailySeries} width={dailyWidth} height={320}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="ordersQty" name="Заказы" stroke="#0f766e" strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="netRevenue" name="Чистая выручка" stroke="#334155" strokeWidth={2} />
            </LineChart>
          ) : (
            <div className="h-80 animate-pulse rounded-md bg-slate-100" />
          )}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">Сравнение маркетплейсов</h2>
        <div ref={marketplaceRef} className="mt-4 h-80 min-w-0">
          {marketplaceWidth > 0 ? (
            <BarChart data={marketplaceData} width={marketplaceWidth} height={320}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="ordersQty" name="Заказы" fill="#0891b2" radius={[4, 4, 0, 0]} />
              <Bar dataKey="buyoutQty" name="Выкупы" fill="#475569" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <div className="h-80 animate-pulse rounded-md bg-slate-100" />
          )}
        </div>
      </section>
    </div>
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

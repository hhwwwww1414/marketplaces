"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Banknote,
  Boxes,
  Clock3,
  PackageCheck,
  Percent,
  PieChart as PieChartIcon,
  ShoppingCart,
  SlidersHorizontal,
  TrendingUp,
} from "lucide-react";
import { calculateKpi, compareKpi, round, safeDivide } from "@/lib/metrics";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import type { KpiSnapshot, NormalizedRecord } from "@/lib/types";

type DetailedDashboardProps = {
  records: NormalizedRecord[];
};

type MarketplaceFilter = "all" | "ozon" | "wildberries";
type DirectionFilter = "all" | "orders" | "goods" | "daily";
type PeriodFilter = "all" | "2025" | "2026" | "last90" | "last30";
type MainMetric = "ordersQty" | "netRevenue" | "buyoutQty";
type TopDimension = "products" | "warehouses" | "regions";

const COLORS = ["#0891b2", "#0f766e", "#475569", "#ca8a04", "#be123c", "#7c3aed"];

export function DetailedDashboard({ records }: DetailedDashboardProps) {
  const [marketplace, setMarketplace] = useState<MarketplaceFilter>("all");
  const [direction, setDirection] = useState<DirectionFilter>("all");
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [mainMetric, setMainMetric] = useState<MainMetric>("netRevenue");
  const [topDimension, setTopDimension] = useState<TopDimension>("products");

  const filteredRecords = useMemo(
    () => filterRecords(records, { marketplace, direction, period }),
    [records, marketplace, direction, period],
  );
  const kpi = useMemo(() => calculateKpi(filteredRecords), [filteredRecords]);
  const previousKpi = useMemo(
    () => calculateKpi(getPreviousComparableSlice(records, filteredRecords)),
    [records, filteredRecords],
  );
  const deltas = useMemo(() => compareKpi(previousKpi, kpi), [previousKpi, kpi]);
  const trend = useMemo(() => buildMonthlySeries(filteredRecords), [filteredRecords]);
  const marketplaceData = useMemo(() => buildMarketplaceData(filteredRecords), [filteredRecords]);
  const sourceData = useMemo(() => buildSourceData(filteredRecords), [filteredRecords]);
  const funnelData = useMemo(() => buildFunnelData(kpi), [kpi]);
  const topData = useMemo(() => buildTopData(filteredRecords, topDimension), [filteredRecords, topDimension]);
  const matrixData = useMemo(() => buildMarketplaceMonthMatrix(filteredRecords), [filteredRecords]);
  const riskSignals = useMemo(() => buildRiskSignals(kpi), [kpi]);

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">
              <SlidersHorizontal className="size-4" aria-hidden="true" />
              Детализация анализа
            </div>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">Фильтры управленческого среза</h2>
          </div>
          <p className="text-sm text-slate-500">В выборке: {formatNumber(filteredRecords.length)} записей</p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <SelectField label="Маркетплейс" value={marketplace} onChange={(value) => setMarketplace(value as MarketplaceFilter)}>
            <option value="all">Все площадки</option>
            <option value="ozon">Ozon</option>
            <option value="wildberries">Wildberries</option>
          </SelectField>
          <SelectField label="Направление" value={direction} onChange={(value) => setDirection(value as DirectionFilter)}>
            <option value="all">Все направления</option>
            <option value="orders">Заказы</option>
            <option value="goods">Товары и остатки</option>
            <option value="daily">Продажи по дням</option>
          </SelectField>
          <SelectField label="Период" value={period} onChange={(value) => setPeriod(value as PeriodFilter)}>
            <option value="all">Весь период</option>
            <option value="2025">2025 год</option>
            <option value="2026">2026 год</option>
            <option value="last90">Последние 90 дней</option>
            <option value="last30">Последние 30 дней</option>
          </SelectField>
          <SelectField label="Главный график" value={mainMetric} onChange={(value) => setMainMetric(value as MainMetric)}>
            <option value="netRevenue">Чистая выручка</option>
            <option value="ordersQty">Заказы</option>
            <option value="buyoutQty">Выкупы</option>
          </SelectField>
          <SelectField label="Топ-срез" value={topDimension} onChange={(value) => setTopDimension(value as TopDimension)}>
            <option value="products">Товары</option>
            <option value="warehouses">Склады</option>
            <option value="regions">Регионы</option>
          </SelectField>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile title="Заказы" value={formatNumber(kpi.ordersQty)} note="Суммарный спрос в выбранном срезе" icon={ShoppingCart} />
        <MetricTile title="Чистая выручка" value={formatCurrency(kpi.netRevenue)} note="Выручка к перечислению и оплаченные суммы" icon={Banknote} />
        <MetricTile title="Доля выкупа" value={formatPercent(kpi.buyoutRate)} note="Качество спроса и клиентский блок" icon={PackageCheck} />
        <MetricTile title="Доля отмен" value={formatPercent(kpi.cancellationRate)} note="Операционный риск по заказам" icon={Percent} />
        <MetricTile title="Средний заказ" value={formatCurrency(kpi.avgOrderValue)} note="Средняя сумма заказа до выкупа" icon={TrendingUp} />
        <MetricTile title="На выкуп" value={formatCurrency(kpi.avgNetRevenuePerBuyout)} note="Средняя чистая выручка на выкуп" icon={PieChartIcon} />
        <MetricTile title="Остатки" value={formatNumber(kpi.stockQty)} note="Текущий запас по товарным строкам" icon={Boxes} />
        <MetricTile title="Обработка" value={kpi.avgProcessingHours === null ? "нет данных" : `${formatNumber(kpi.avgProcessingHours)} ч`} note="Среднее время до отгрузки" icon={Clock3} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
        <ChartPanel title="Динамика выбранного показателя" subtitle="Помесячная картина с сопоставлением заказов и выкупов">
          <MeasuredChart>
            {(width) => (
              <ComposedChart data={trend} width={width} height={360}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatChartNumber(value)} />
                <Legend />
                <Bar yAxisId="left" dataKey="ordersQty" name="Заказы" fill="#bae6fd" radius={[4, 4, 0, 0]} />
                <Line yAxisId="left" type="monotone" dataKey="buyoutQty" name="Выкупы" stroke="#0f766e" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey={mainMetric} name={metricLabel(mainMetric)} stroke="#334155" strokeWidth={2} />
              </ComposedChart>
            )}
          </MeasuredChart>
        </ChartPanel>

        <ChartPanel title="Воронка реализации" subtitle="Переход от заказа к выкупу и доставке">
          <MeasuredChart>
            {(width) => (
              <BarChart data={funnelData} width={width} height={360} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatChartNumber(value)} />
                <Bar dataKey="value" name="Количество" fill="#0891b2" radius={[0, 4, 4, 0]} />
              </BarChart>
            )}
          </MeasuredChart>
        </ChartPanel>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <ChartPanel title="Структура по площадкам" subtitle="Доля чистой выручки по маркетплейсам">
          <MeasuredChart height={300}>
            {(width) => (
              <PieChart width={width} height={300}>
                <Pie data={marketplaceData} dataKey="netRevenue" nameKey="label" outerRadius={96} label>
                  {marketplaceData.map((entry, index) => (
                    <Cell key={entry.label} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatChartCurrency(value)} />
                <Legend />
              </PieChart>
            )}
          </MeasuredChart>
        </ChartPanel>

        <ChartPanel title="Источники результата" subtitle="Заказы, товарные остатки и дневные продажи">
          <MeasuredChart height={300}>
            {(width) => (
              <AreaChart data={sourceData} width={width} height={300}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatChartNumber(value)} />
                <Area dataKey="ordersQty" name="Заказы" fill="#67e8f9" stroke="#0891b2" />
              </AreaChart>
            )}
          </MeasuredChart>
        </ChartPanel>

        <ChartPanel title="Сигналы риска" subtitle="Автоматическая интерпретация выбранного среза">
          <div className="space-y-3">
            {riskSignals.map((risk) => (
              <div key={risk.title} className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-slate-900">{risk.title}</p>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${riskClassName(risk.level)}`}>
                    {risk.level}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{risk.description}</p>
              </div>
            ))}
          </div>
        </ChartPanel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <ChartPanel title={topTitle(topDimension)} subtitle="Сортировка по чистой выручке">
          <MeasuredChart>
            {(width) => (
              <BarChart data={topData} width={width} height={360}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} interval={0} angle={-18} textAnchor="end" height={72} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value, name) => (name === "Чистая выручка" ? formatChartCurrency(value) : formatChartNumber(value))} />
                <Legend />
                <Bar dataKey="netRevenue" name="Чистая выручка" fill="#0891b2" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ordersQty" name="Заказы" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </MeasuredChart>
        </ChartPanel>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Отклонения к сопоставимому периоду</h2>
          <div className="mt-4 space-y-3">
            {deltas.slice(0, 6).map((delta) => (
              <div key={delta.key} className="rounded-md bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-900">{delta.label}</p>
                  <span className={delta.delta !== null && delta.delta >= 0 ? "text-sm font-semibold text-emerald-700" : "text-sm font-semibold text-rose-700"}>
                    {delta.delta === null ? "нет сравнения" : formatNumber(delta.delta)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Было {formatNumber(delta.baseline)} · стало {formatNumber(delta.project)} · изменение {formatPercent(delta.deltaPct)}
                </p>
              </div>
            ))}
          </div>
        </section>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">Матрица выручки по месяцам и площадкам</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-3 pr-4 font-medium">Месяц</th>
                <th className="py-3 pr-4 font-medium">Ozon</th>
                <th className="py-3 pr-4 font-medium">Wildberries</th>
                <th className="py-3 pr-4 font-medium">Всего</th>
                <th className="py-3 pr-4 font-medium">Доля Ozon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {matrixData.map((row) => (
                <tr key={row.period}>
                  <td className="py-3 pr-4 font-medium text-slate-900">{row.period}</td>
                  <td className="py-3 pr-4 text-slate-600">{formatCurrency(row.ozon)}</td>
                  <td className="py-3 pr-4 text-slate-600">{formatCurrency(row.wildberries)}</td>
                  <td className="py-3 pr-4 text-slate-600">{formatCurrency(row.total)}</td>
                  <td className="py-3 pr-4 text-slate-600">{formatPercent(row.ozonShare)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SelectField({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
      >
        {children}
      </select>
    </label>
  );
}

function MetricTile({ title, value, note, icon: Icon }: { title: string; value: string; note: string; icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }> }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-cyan-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold tracking-normal text-slate-950">{value}</p>
        </div>
        <span className="grid size-10 place-items-center rounded-md bg-cyan-50 text-cyan-700">
          <Icon className="size-5" aria-hidden />
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-500">{note}</p>
    </article>
  );
}

function ChartPanel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function MeasuredChart({ children, height = 360 }: { children: (width: number) => React.ReactNode; height?: number }) {
  const { ref, width } = useChartWidth();
  return (
    <div ref={ref} className="min-w-0" style={{ height }}>
      {width > 0 ? children(width) : <div className="h-full animate-pulse rounded-md bg-slate-100" />}
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

function filterRecords(records: NormalizedRecord[], filters: { marketplace: MarketplaceFilter; direction: DirectionFilter; period: PeriodFilter }) {
  const maxDate = records.map((record) => record.date).filter(Boolean).sort().at(-1) ?? null;

  return records.filter((record) => {
    if (filters.marketplace !== "all" && record.marketplace !== filters.marketplace) return false;
    if (filters.direction !== "all" && sourceDirection(record) !== filters.direction) return false;
    return matchesPeriod(record, filters.period, maxDate);
  });
}

function matchesPeriod(record: NormalizedRecord, period: PeriodFilter, maxDate: string | null) {
  if (period === "all") return true;
  if (!record.date) return false;
  if (period === "2025" || period === "2026") return record.date.startsWith(period);
  if (!maxDate) return true;
  const current = new Date(record.date).getTime();
  const latest = new Date(maxDate).getTime();
  const days = period === "last30" ? 30 : 90;
  return latest - current <= days * 24 * 60 * 60 * 1000;
}

function sourceDirection(record: NormalizedRecord): DirectionFilter {
  if (record.sourceType === "ozon_orders") return "orders";
  if (record.sourceType === "wb_supplier_goods") return "goods";
  return "daily";
}

function getPreviousComparableSlice(allRecords: NormalizedRecord[], currentRecords: NormalizedRecord[]) {
  const currentDates = currentRecords.map((record) => record.date).filter(Boolean).sort() as string[];
  if (currentDates.length < 2) return [];
  const start = currentDates[0];
  const end = currentDates[currentDates.length - 1];
  const days = Math.max(1, Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000));
  const previousEnd = new Date(new Date(start).getTime() - 86400000);
  const previousStart = new Date(previousEnd.getTime() - days * 86400000);
  const from = previousStart.toISOString().slice(0, 10);
  const to = previousEnd.toISOString().slice(0, 10);
  return allRecords.filter((record) => record.date && record.date >= from && record.date <= to);
}

function buildMonthlySeries(records: NormalizedRecord[]) {
  const byMonth = new Map<string, NormalizedRecord[]>();
  for (const record of records) {
    if (!record.date) continue;
    const period = record.date.slice(0, 7);
    byMonth.set(period, [...(byMonth.get(period) ?? []), record]);
  }

  return [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([period, rows]) => {
    const kpi = calculateKpi(rows);
    return { period, ordersQty: kpi.ordersQty, buyoutQty: kpi.buyoutQty, netRevenue: kpi.netRevenue, buyoutRate: kpi.buyoutRate };
  });
}

function buildMarketplaceData(records: NormalizedRecord[]) {
  return ["ozon", "wildberries"].map((marketplace) => {
    const kpi = calculateKpi(records.filter((record) => record.marketplace === marketplace));
    return { label: marketplace === "ozon" ? "Ozon" : "Wildberries", ordersQty: kpi.ordersQty, netRevenue: kpi.netRevenue };
  });
}

function buildSourceData(records: NormalizedRecord[]) {
  const labels: Record<DirectionFilter, string> = { all: "Все", orders: "Заказы", goods: "Товары", daily: "Продажи" };
  return (["orders", "goods", "daily"] as DirectionFilter[]).map((direction) => {
    const kpi = calculateKpi(records.filter((record) => sourceDirection(record) === direction));
    return { label: labels[direction], ordersQty: kpi.ordersQty, netRevenue: kpi.netRevenue };
  });
}

function buildFunnelData(kpi: KpiSnapshot) {
  return [
    { label: "Заказы", value: kpi.ordersQty },
    { label: "Доставки", value: kpi.deliveredQty },
    { label: "Выкупы", value: kpi.buyoutQty },
    { label: "Отмены", value: kpi.cancelledQty },
  ];
}

function buildTopData(records: NormalizedRecord[], dimension: TopDimension) {
  const groups = new Map<string, NormalizedRecord[]>();
  for (const record of records) {
    const key = dimensionValue(record, dimension);
    groups.set(key, [...(groups.get(key) ?? []), record]);
  }

  return [...groups.entries()]
    .map(([label, rows]) => {
      const kpi = calculateKpi(rows);
      return { label: label.length > 28 ? `${label.slice(0, 28)}...` : label, ordersQty: kpi.ordersQty, buyoutQty: kpi.buyoutQty, netRevenue: kpi.netRevenue };
    })
    .sort((a, b) => b.netRevenue - a.netRevenue)
    .slice(0, 8);
}

function dimensionValue(record: NormalizedRecord, dimension: TopDimension) {
  if (dimension === "warehouses") return record.warehouse ?? "Склад не указан";
  if (dimension === "regions") return record.region ?? record.city ?? "Регион не указан";
  return record.productName ?? record.sellerArticle ?? record.sku ?? "Товар не указан";
}

function buildMarketplaceMonthMatrix(records: NormalizedRecord[]) {
  const byMonth = new Map<string, NormalizedRecord[]>();
  for (const record of records) {
    if (!record.date) continue;
    const period = record.date.slice(0, 7);
    byMonth.set(period, [...(byMonth.get(period) ?? []), record]);
  }

  return [...byMonth.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 10)
    .map(([period, rows]) => {
      const ozon = calculateKpi(rows.filter((record) => record.marketplace === "ozon")).netRevenue;
      const wildberries = calculateKpi(rows.filter((record) => record.marketplace === "wildberries")).netRevenue;
      const total = ozon + wildberries;
      return { period, ozon, wildberries, total, ozonShare: round(safeDivide(ozon, total) * 100) };
    });
}

function buildRiskSignals(kpi: KpiSnapshot) {
  return [
    {
      title: "Выкуп",
      level: kpi.buyoutRate >= 70 ? "норма" : kpi.buyoutRate >= 45 ? "контроль" : "риск",
      description: kpi.buyoutRate >= 70 ? "Доля выкупа поддерживает устойчивость выручки." : "Нужно проверить ассортимент, ожидания покупателей и причины отказов.",
    },
    {
      title: "Отмены",
      level: kpi.cancellationRate <= 8 ? "норма" : kpi.cancellationRate <= 18 ? "контроль" : "риск",
      description: kpi.cancellationRate <= 8 ? "Отмены не оказывают критичного давления на проект." : "Рост отмен может ухудшить прогноз и требует операционного анализа.",
    },
    {
      title: "Операции",
      level: (kpi.avgProcessingHours ?? 0) <= 18 ? "норма" : (kpi.avgProcessingHours ?? 0) <= 36 ? "контроль" : "риск",
      description: (kpi.avgProcessingHours ?? 0) <= 18 ? "Скорость обработки не выглядит ограничением для проекта." : "Длительная обработка может влиять на доставку и клиентскую оценку.",
    },
  ];
}

function riskClassName(level: string) {
  if (level === "норма") return "bg-emerald-50 text-emerald-700";
  if (level === "контроль") return "bg-amber-50 text-amber-700";
  return "bg-rose-50 text-rose-700";
}

function metricLabel(metric: MainMetric) {
  if (metric === "ordersQty") return "Заказы";
  if (metric === "buyoutQty") return "Выкупы";
  return "Чистая выручка";
}

function topTitle(dimension: TopDimension) {
  if (dimension === "warehouses") return "Топ складов";
  if (dimension === "regions") return "Топ регионов";
  return "Топ товаров";
}

function formatChartNumber(value: unknown) {
  return formatNumber(typeof value === "number" ? value : Number(value ?? 0));
}

function formatChartCurrency(value: unknown) {
  return formatCurrency(typeof value === "number" ? value : Number(value ?? 0));
}

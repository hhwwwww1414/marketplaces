import type { KpiDelta, KpiSnapshot, NormalizedRecord } from "./types";

export function calculateKpi(records: NormalizedRecord[]): KpiSnapshot {
  const totals = records.reduce(
    (acc, record) => {
      acc.ordersQty += record.ordersQty;
      acc.buyoutQty += record.buyoutQty;
      acc.deliveredQty += record.deliveredQty;
      acc.cancelledQty += record.cancelledQty;
      acc.stockQty += record.stockQty;
      acc.grossRevenue += record.grossRevenue;
      acc.netRevenue += record.netRevenue;
      acc.paidByCustomer += record.paidByCustomer;
      if (record.processingHours !== null) {
        acc.processingHours += record.processingHours;
        acc.processingCount += 1;
      }
      return acc;
    },
    {
      ordersQty: 0,
      buyoutQty: 0,
      deliveredQty: 0,
      cancelledQty: 0,
      stockQty: 0,
      grossRevenue: 0,
      netRevenue: 0,
      paidByCustomer: 0,
      processingHours: 0,
      processingCount: 0,
    },
  );

  return {
    ordersQty: totals.ordersQty,
    buyoutQty: totals.buyoutQty,
    deliveredQty: totals.deliveredQty,
    cancelledQty: totals.cancelledQty,
    stockQty: totals.stockQty,
    grossRevenue: round(totals.grossRevenue),
    netRevenue: round(totals.netRevenue),
    paidByCustomer: round(totals.paidByCustomer),
    buyoutRate: percent(totals.buyoutQty, totals.ordersQty),
    cancellationRate: percent(totals.cancelledQty, totals.ordersQty),
    avgOrderValue: round(safeDivide(totals.grossRevenue, totals.ordersQty)),
    avgNetRevenuePerBuyout: round(safeDivide(totals.netRevenue, totals.buyoutQty)),
    avgProcessingHours:
      totals.processingCount > 0 ? round(totals.processingHours / totals.processingCount) : null,
  };
}

export function compareKpi(baseline: KpiSnapshot, project: KpiSnapshot): KpiDelta[] {
  const labels: Partial<Record<keyof KpiSnapshot, string>> = {
    ordersQty: "Заказы",
    buyoutQty: "Выкупы",
    cancelledQty: "Отмены",
    netRevenue: "Чистая выручка",
    buyoutRate: "Доля выкупа",
    cancellationRate: "Доля отмен",
    avgOrderValue: "Средний заказ",
    avgProcessingHours: "Среднее время обработки",
  };

  return (Object.keys(labels) as Array<keyof KpiSnapshot>).map((key) => {
    const baseValue = toNullableNumber(baseline[key]);
    const projectValue = toNullableNumber(project[key]);
    const delta =
      baseValue === null || projectValue === null ? null : round(projectValue - baseValue);
    return {
      key,
      label: labels[key] ?? String(key),
      baseline: baseValue,
      project: projectValue,
      delta,
      deltaPct:
        baseValue === null || projectValue === null || baseValue === 0
          ? null
          : round(((projectValue - baseValue) / Math.abs(baseValue)) * 100),
    };
  });
}

export function splitBaselineProject(records: NormalizedRecord[]): {
  baselineRecords: NormalizedRecord[];
  projectRecords: NormalizedRecord[];
} {
  const dated = records.filter((record) => record.date !== null).sort((a, b) => a.date!.localeCompare(b.date!));
  if (dated.length < 2) {
    const midpoint = Math.ceil(records.length / 2);
    return {
      baselineRecords: records.slice(0, midpoint),
      projectRecords: records.slice(midpoint),
    };
  }

  const uniqueDates = [...new Set(dated.map((record) => record.date!))];
  const splitDate = uniqueDates[Math.floor(uniqueDates.length / 2)];

  return {
    baselineRecords: records.filter((record) => record.date !== null && record.date <= splitDate),
    projectRecords: records.filter((record) => record.date === null || record.date > splitDate),
  };
}

export function marketplaceBreakdown(records: NormalizedRecord[]) {
  return ["ozon", "wildberries"].map((marketplace) => {
    const subset = records.filter((record) => record.marketplace === marketplace);
    const kpi = calculateKpi(subset);
    return {
      marketplace,
      ordersQty: kpi.ordersQty,
      buyoutQty: kpi.buyoutQty,
      netRevenue: kpi.netRevenue,
      cancellationRate: kpi.cancellationRate,
    };
  });
}

export function dailySeries(records: NormalizedRecord[]) {
  const byDate = new Map<string, NormalizedRecord[]>();
  for (const record of records) {
    if (!record.date) continue;
    byDate.set(record.date, [...(byDate.get(record.date) ?? []), record]);
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, rows]) => ({
      date,
      ordersQty: calculateKpi(rows).ordersQty,
      netRevenue: calculateKpi(rows).netRevenue,
      buyoutRate: calculateKpi(rows).buyoutRate,
    }));
}

export function safeDivide(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

export function percent(numerator: number, denominator: number): number {
  return round(safeDivide(numerator, denominator) * 100);
}

export function round(value: number): number {
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : 0;
}

function toNullableNumber(value: unknown): number | null {
  return typeof value === "number" ? value : null;
}

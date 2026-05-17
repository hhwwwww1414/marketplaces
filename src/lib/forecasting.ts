import type { ForecastScenario, KpiSnapshot, ProjectScoreResult } from "./types";

const SCENARIOS: Array<Pick<ForecastScenario, "name" | "factor">> = [
  { name: "conservative", factor: 0.85 },
  { name: "base", factor: 1 },
  { name: "optimistic", factor: 1.15 },
];

export function buildForecast(kpi: KpiSnapshot, score: ProjectScoreResult): ForecastScenario[] {
  return SCENARIOS.map((scenario) => ({
    name: scenario.name,
    factor: scenario.factor,
    ordersQty: Math.round(kpi.ordersQty * scenario.factor),
    buyoutQty: Math.round(kpi.buyoutQty * scenario.factor),
    netRevenue: round(kpi.netRevenue * scenario.factor),
    projectScore: Math.max(0, Math.min(100, Math.round(score.totalScore * scenario.factor))),
  }));
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

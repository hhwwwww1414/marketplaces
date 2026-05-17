import type { ProjectScoreInput, ProjectScoreResult, ProjectScoreWeights } from "./types";

const DEFAULT_WEIGHTS: ProjectScoreWeights = {
  financialWeight: 0.35,
  customerWeight: 0.25,
  operationalWeight: 0.2,
  platformWeight: 0.2,
};

export function calculateProjectScore(input: ProjectScoreInput): ProjectScoreResult {
  const weights = normalizeWeights({ ...DEFAULT_WEIGHTS, ...input.weights });
  const financialScore = clampScore(
    input.kpi.avgOrderValue / 60 + input.kpi.netRevenue / 5000 + input.kpi.avgNetRevenuePerBuyout / 80,
  );
  const customerScore = clampScore(input.kpi.buyoutRate - input.kpi.cancellationRate * 0.7 + 25);
  const operationalScore = clampScore(
    100 - (input.kpi.avgProcessingHours ?? 24) * 1.5 - input.kpi.cancellationRate * 0.6,
  );
  const platformScore = clampScore(
    input.kpi.ordersQty / 4 + input.kpi.stockQty / 8 + input.kpi.deliveredQty / 3,
  );

  const totalScore = Math.round(
    financialScore * weights.financialWeight +
      customerScore * weights.customerWeight +
      operationalScore * weights.operationalWeight +
      platformScore * weights.platformWeight,
  );

  return {
    totalScore,
    financialScore,
    customerScore,
    operationalScore,
    platformScore,
    weights,
    interpretation: interpret(totalScore),
  };
}

export function normalizeWeights(weights: ProjectScoreWeights): ProjectScoreWeights {
  const sum =
    weights.financialWeight +
    weights.customerWeight +
    weights.operationalWeight +
    weights.platformWeight;

  if (sum <= 0) {
    return DEFAULT_WEIGHTS;
  }

  return {
    financialWeight: roundWeight(weights.financialWeight / sum),
    customerWeight: roundWeight(weights.customerWeight / sum),
    operationalWeight: roundWeight(weights.operationalWeight / sum),
    platformWeight: roundWeight(weights.platformWeight / sum),
  };
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function roundWeight(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function interpret(score: number): string {
  if (score >= 80) {
    return "Проект имеет высокий потенциал и может масштабироваться при контроле операционных рисков.";
  }
  if (score >= 60) {
    return "Проект выглядит жизнеспособным, но требует точечной работы с выкупами, отменами и экономикой.";
  }
  if (score >= 40) {
    return "Проект находится в зоне неопределенности: перед запуском нужно снизить риски и уточнить прогноз.";
  }
  return "Проект требует пересмотра параметров реализации до принятия управленческого решения.";
}

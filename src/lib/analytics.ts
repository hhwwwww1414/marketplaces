import recordsJson from "@/data/generated/normalized-records.json";
import {
  calculateKpi,
  compareKpi,
  dailySeries,
  marketplaceBreakdown,
  splitBaselineProject,
} from "./metrics";
import { calculateProjectScore } from "./scoring";
import { buildForecast } from "./forecasting";
import { sanitizeForLLM } from "./privacy";
import type { NormalizedRecord, SanitizedAnalyticsPayload } from "./types";

export const records = recordsJson as NormalizedRecord[];

export function getAnalytics() {
  const { baselineRecords, projectRecords } = splitBaselineProject(records);
  const allKpi = calculateKpi(records);
  const baseline = calculateKpi(baselineRecords);
  const project = calculateKpi(projectRecords.length > 0 ? projectRecords : records);
  const projectScore = calculateProjectScore({ kpi: project });
  const forecast = buildForecast(project, projectScore);
  const deltas = compareKpi(baseline, project);
  const risks = detectRisks(project);
  const llmPayload = sanitizeForLLM({
    generatedAt: new Date().toISOString(),
    projectScore,
    baseline,
    project,
    deltas,
    forecast,
    risks,
  }) satisfies SanitizedAnalyticsPayload;

  return {
    records,
    allKpi,
    baseline,
    project,
    deltas,
    projectScore,
    forecast,
    risks,
    llmPayload,
    marketplaceBreakdown: marketplaceBreakdown(records),
    dailySeries: dailySeries(records).slice(-30),
  };
}

function detectRisks(kpi: ReturnType<typeof calculateKpi>): string[] {
  const risks: string[] = [];
  if (kpi.cancellationRate > 15) {
    risks.push("Высокая доля отмен снижает надежность прогноза и требует проверки причин отказов.");
  }
  if (kpi.buyoutRate < 60) {
    risks.push("Доля выкупа ниже целевого уровня: есть риск недополучения net revenue.");
  }
  if ((kpi.avgProcessingHours ?? 0) > 24) {
    risks.push("Среднее время обработки превышает сутки и может ухудшить клиентский блок.");
  }
  if (risks.length === 0) {
    risks.push("Критические риски по агрегированным показателям не выявлены.");
  }
  return risks;
}

import type { SanitizedAnalyticsPayload } from "./types";

export const PII_COLUMNS = [
  "Имя покупателя",
  "Email покупателя",
  "Имя получателя",
  "Телефон получателя",
  "Адрес доставки",
  "Адрес покупателя",
  "Индекс",
];

const PII_KEY_PATTERNS = [
  /имя\s*покуп/i,
  /email/i,
  /e-mail/i,
  /телефон/i,
  /адрес/i,
  /индекс/i,
  /phone/i,
  /address/i,
  /customerName/i,
];

export function removePIIColumns<T extends Record<string, unknown>>(
  rows: T[],
): Record<string, unknown>[] {
  return rows.map((row) => {
    const safe: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      if (!isPIIKey(key)) {
        safe[key] = value;
      }
    }
    return safe;
  });
}

export function sanitizeForLLM(payload: unknown): SanitizedAnalyticsPayload {
  const scrubbed = scrubValue(payload) as Partial<SanitizedAnalyticsPayload>;
  return {
    generatedAt: String(scrubbed.generatedAt ?? new Date().toISOString()),
    projectScore: scrubbed.projectScore as SanitizedAnalyticsPayload["projectScore"],
    baseline: scrubbed.baseline as SanitizedAnalyticsPayload["baseline"],
    project: scrubbed.project as SanitizedAnalyticsPayload["project"],
    deltas: Array.isArray(scrubbed.deltas) ? scrubbed.deltas : [],
    forecast: Array.isArray(scrubbed.forecast) ? scrubbed.forecast : [],
    risks: Array.isArray(scrubbed.risks) ? scrubbed.risks.map(String) : [],
  };
}

function scrubValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(scrubValue);
  }

  if (value && typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      if (!isPIIKey(key)) {
        output[key] = scrubValue(child);
      }
    }
    return output;
  }

  return value;
}

function isPIIKey(key: string): boolean {
  return PII_COLUMNS.includes(key) || PII_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

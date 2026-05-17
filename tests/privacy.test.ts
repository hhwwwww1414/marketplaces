import { describe, expect, it } from "vitest";
import { removePIIColumns, sanitizeForLLM } from "@/lib/privacy";

describe("privacy", () => {
  it("removes PII columns from source rows", () => {
    const rows = removePIIColumns([
      {
        "Номер заказа": "1",
        "Имя покупателя": "Иван",
        "Email покупателя": "ivan@example.com",
        "Адрес доставки": "Москва",
        "Сумма отправления": 1000,
      },
    ]);

    expect(rows[0]).toEqual({
      "Номер заказа": "1",
      "Сумма отправления": 1000,
    });
  });

  it("does not pass PII-shaped fields to the LLM payload", () => {
    const sanitized = sanitizeForLLM({
      generatedAt: "2026-05-17T00:00:00.000Z",
      projectScore: { totalScore: 70 },
      baseline: {},
      project: {},
      deltas: [],
      forecast: [],
      risks: [],
      email: "secret@example.com",
      nested: { phone: "+7999", address: "hidden" },
    });

    expect(JSON.stringify(sanitized)).not.toContain("secret@example.com");
    expect(JSON.stringify(sanitized)).not.toContain("+7999");
    expect(JSON.stringify(sanitized)).not.toContain("hidden");
  });
});

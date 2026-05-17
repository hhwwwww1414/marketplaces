import { describe, expect, it } from "vitest";
import { buildForecast } from "@/lib/forecasting";

describe("forecasting", () => {
  it("builds 0.85 / 1 / 1.15 scenarios", () => {
    const forecast = buildForecast(
      {
        ordersQty: 100,
        buyoutQty: 80,
        deliveredQty: 80,
        cancelledQty: 5,
        stockQty: 0,
        grossRevenue: 100000,
        netRevenue: 90000,
        paidByCustomer: 95000,
        buyoutRate: 80,
        cancellationRate: 5,
        avgOrderValue: 1000,
        avgNetRevenuePerBuyout: 1125,
        avgProcessingHours: 12,
      },
      {
        totalScore: 70,
        financialScore: 80,
        customerScore: 75,
        operationalScore: 60,
        platformScore: 65,
        weights: {
          financialWeight: 0.35,
          customerWeight: 0.25,
          operationalWeight: 0.2,
          platformWeight: 0.2,
        },
        interpretation: "",
      },
    );

    expect(forecast.map((scenario) => scenario.factor)).toEqual([0.85, 1, 1.15]);
    expect(forecast[0].ordersQty).toBe(85);
    expect(forecast[2].netRevenue).toBe(103500);
  });
});

import { describe, expect, it } from "vitest";
import { calculateProjectScore, normalizeWeights } from "@/lib/scoring";

describe("scoring", () => {
  it("calculates Project Score and normalizes custom weights", () => {
    const score = calculateProjectScore({
      kpi: {
        ordersQty: 100,
        buyoutQty: 80,
        deliveredQty: 75,
        cancelledQty: 5,
        stockQty: 200,
        grossRevenue: 100000,
        netRevenue: 80000,
        paidByCustomer: 90000,
        buyoutRate: 80,
        cancellationRate: 5,
        avgOrderValue: 1000,
        avgNetRevenuePerBuyout: 1000,
        avgProcessingHours: 10,
      },
      weights: {
        financialWeight: 2,
        customerWeight: 1,
        operationalWeight: 1,
        platformWeight: 0,
      },
    });

    expect(score.totalScore).toBeGreaterThan(0);
    expect(score.totalScore).toBeLessThanOrEqual(100);
    expect(score.weights.financialWeight).toBe(0.5);
  });

  it("normalizes weight sum to one", () => {
    const weights = normalizeWeights({
      financialWeight: 3,
      customerWeight: 3,
      operationalWeight: 2,
      platformWeight: 2,
    });

    expect(weights.financialWeight + weights.customerWeight + weights.operationalWeight + weights.platformWeight).toBeCloseTo(1);
  });
});

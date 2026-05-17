import { describe, expect, it } from "vitest";
import { calculateKpi } from "@/lib/metrics";
import type { NormalizedRecord } from "@/lib/types";

describe("metrics", () => {
  it("calculates buyout rate, cancellation rate and average order value", () => {
    const kpi = calculateKpi([
      record({ ordersQty: 10, buyoutQty: 7, cancelledQty: 2, grossRevenue: 5000 }),
      record({ ordersQty: 5, buyoutQty: 2, cancelledQty: 1, grossRevenue: 2500 }),
    ]);

    expect(kpi.buyoutRate).toBe(60);
    expect(kpi.cancellationRate).toBe(20);
    expect(kpi.avgOrderValue).toBe(500);
  });
});

function record(overrides: Partial<NormalizedRecord>): NormalizedRecord {
  return {
    id: "id",
    sourceFile: "source",
    marketplace: "ozon",
    sourceType: "ozon_orders",
    date: null,
    week: null,
    brand: null,
    category: null,
    productName: null,
    sellerArticle: null,
    sku: null,
    barcode: null,
    warehouse: null,
    region: null,
    city: null,
    deliveryCluster: null,
    shippingCluster: null,
    deliveryMethod: null,
    status: null,
    ordersQty: 0,
    buyoutQty: 0,
    deliveredQty: 0,
    cancelledQty: 0,
    stockQty: 0,
    grossRevenue: 0,
    netRevenue: 0,
    paidByCustomer: 0,
    itemPrice: 0,
    discountRub: 0,
    processingDateTime: null,
    shipmentDateTime: null,
    deliveryDateTime: null,
    cancellationDateTime: null,
    processingHours: null,
    isCancelled: false,
    isDelivered: false,
    isBuyout: false,
    ...overrides,
  };
}

export type Marketplace = "ozon" | "wildberries";

export type SourceType = "ozon_orders" | "wb_supplier_goods" | "wb_daily_report";

export type NormalizedRecord = {
  id: string;
  sourceFile: string;
  marketplace: Marketplace;
  sourceType: SourceType;
  date: string | null;
  week: number | null;
  brand: string | null;
  category: string | null;
  productName: string | null;
  sellerArticle: string | null;
  sku: string | null;
  barcode: string | null;
  warehouse: string | null;
  region: string | null;
  city: string | null;
  deliveryCluster: string | null;
  shippingCluster: string | null;
  deliveryMethod: string | null;
  status: string | null;
  ordersQty: number;
  buyoutQty: number;
  deliveredQty: number;
  cancelledQty: number;
  stockQty: number;
  grossRevenue: number;
  netRevenue: number;
  paidByCustomer: number;
  itemPrice: number;
  discountRub: number;
  processingDateTime: string | null;
  shipmentDateTime: string | null;
  deliveryDateTime: string | null;
  cancellationDateTime: string | null;
  processingHours: number | null;
  isCancelled: boolean;
  isDelivered: boolean;
  isBuyout: boolean;
};

export type KpiSnapshot = {
  ordersQty: number;
  buyoutQty: number;
  deliveredQty: number;
  cancelledQty: number;
  stockQty: number;
  grossRevenue: number;
  netRevenue: number;
  paidByCustomer: number;
  buyoutRate: number;
  cancellationRate: number;
  avgOrderValue: number;
  avgNetRevenuePerBuyout: number;
  avgProcessingHours: number | null;
};

export type KpiDelta = {
  key: keyof KpiSnapshot;
  label: string;
  baseline: number | null;
  project: number | null;
  delta: number | null;
  deltaPct: number | null;
};

export type ProjectScoreInput = {
  kpi: KpiSnapshot;
  weights?: Partial<ProjectScoreWeights>;
};

export type ProjectScoreWeights = {
  financialWeight: number;
  customerWeight: number;
  operationalWeight: number;
  platformWeight: number;
};

export type ProjectScoreResult = {
  totalScore: number;
  financialScore: number;
  customerScore: number;
  operationalScore: number;
  platformScore: number;
  weights: ProjectScoreWeights;
  interpretation: string;
};

export type ForecastScenario = {
  name: "conservative" | "base" | "optimistic";
  factor: number;
  ordersQty: number;
  buyoutQty: number;
  netRevenue: number;
  projectScore: number;
};

export type SanitizedAnalyticsPayload = {
  generatedAt: string;
  projectScore: ProjectScoreResult;
  baseline: KpiSnapshot;
  project: KpiSnapshot;
  deltas: KpiDelta[];
  forecast: ForecastScenario[];
  risks: string[];
};

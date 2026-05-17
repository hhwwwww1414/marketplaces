import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import xlsx from "xlsx";
import { differenceInHours, format, isValid, parse, parseISO } from "date-fns";
import { removePIIColumns } from "../src/lib/privacy";
import type { NormalizedRecord } from "../src/lib/types";

const SOURCE_DIR = path.join(process.cwd(), "data", "source");
const OUTPUT_DIR = path.join(process.cwd(), "src", "data", "generated");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "normalized-records.json");

type Row = Record<string, unknown>;

main();

function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  if (!fs.existsSync(SOURCE_DIR)) {
    fs.writeFileSync(OUTPUT_FILE, "[]\n", "utf8");
    console.warn("data/source not found. Wrote empty generated dataset.");
    return;
  }

  const files = fs.readdirSync(SOURCE_DIR).filter((file) => /\.(csv|xlsx)$/i.test(file));
  const records = files.flatMap((file) => normalizeFile(path.join(SOURCE_DIR, file), file));

  fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify(records, null, 2)}\n`, "utf8");
  console.log(`Prepared ${records.length} normalized records into ${path.relative(process.cwd(), OUTPUT_FILE)}`);
}

function normalizeFile(filePath: string, sourceFile: string): NormalizedRecord[] {
  if (/\.csv$/i.test(sourceFile)) {
    return normalizeOzonOrders(readCsv(filePath), sourceFile);
  }

  const workbook = xlsx.readFile(filePath, { cellDates: true });
  if (sourceFile.toLowerCase().includes("supplier-goods")) {
    return normalizeWbSupplierGoods(readSheet(workbook, "Sheet1"), sourceFile);
  }
  return normalizeWbDailyReport(readSheet(workbook, "report"), sourceFile);
}

function readCsv(filePath: string): Row[] {
  const content = fs.readFileSync(filePath, "utf8");
  const parsed = Papa.parse<Row>(content, {
    header: true,
    delimiter: ";",
    skipEmptyLines: true,
    transformHeader: (header) => header.replace(/^\uFEFF/, "").trim(),
  });

  if (parsed.errors.length > 0) {
    console.warn(`CSV warnings for ${path.basename(filePath)}:`, parsed.errors.slice(0, 3));
  }

  return removePIIColumns(parsed.data) as Row[];
}

function readSheet(workbook: xlsx.WorkBook, sheetName: string): Row[] {
  const sheet = workbook.Sheets[sheetName] ?? workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = xlsx.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: null,
    raw: false,
  });
  const headerIndex = rawRows.findIndex((row) => row.some((cell) => String(cell ?? "").trim() === "Бренд"));
  if (headerIndex === -1) return [];

  const headers = rawRows[headerIndex].map((cell) => String(cell ?? "").trim());
  const rows = rawRows.slice(headerIndex + 1).map((row) => {
    const item: Row = {};
    headers.forEach((header, index) => {
      if (header) item[header] = row[index];
    });
    return item;
  });

  return removePIIColumns(rows.filter((row) => Object.values(row).some((value) => value !== null && value !== ""))) as Row[];
}

function normalizeOzonOrders(rows: Row[], sourceFile: string): NormalizedRecord[] {
  return rows.map((row, index) => {
    const processingDateTime = parseDateTime(row["Принят в обработку"]);
    const shipmentDateTime = parseDateTime(row["Дата отгрузки"]);
    const deliveryDateTime = parseDateTime(row["Дата доставки"]);
    const cancellationDateTime = parseDateTime(row["Дата отмены"]);
    const status = text(row["Статус"]);
    const ordersQty = number(row["Количество"]) || 1;
    const isCancelled = /отмен/i.test(status ?? "") || cancellationDateTime !== null;
    const isDelivered = /достав/i.test(status ?? "") || deliveryDateTime !== null;
    const isBuyout = truthy(row["Выкуп товара"]) || isDelivered;

    return baseRecord({
      id: `ozon-${sourceFile}-${index}`,
      sourceFile,
      sourceType: "ozon_orders",
      marketplace: "ozon",
      date: dateOnly(processingDateTime ?? shipmentDateTime ?? deliveryDateTime ?? cancellationDateTime),
      productName: text(row["Название товара"]),
      sellerArticle: text(row["Артикул"]),
      sku: text(row["SKU"]),
      warehouse: text(row["Склад отгрузки"]),
      region: text(row["Регион доставки"]),
      city: text(row["Город доставки"]),
      deliveryCluster: text(row["Кластер доставки"]),
      shippingCluster: text(row["Кластер отгрузки"]),
      deliveryMethod: text(row["Способ доставки"]),
      status,
      ordersQty,
      buyoutQty: isBuyout ? ordersQty : 0,
      deliveredQty: isDelivered ? ordersQty : 0,
      cancelledQty: isCancelled ? ordersQty : 0,
      grossRevenue: number(row["Сумма отправления"]),
      netRevenue: number(row["Оплачено покупателем"]),
      paidByCustomer: number(row["Оплачено покупателем"]),
      itemPrice: number(row["Ваша цена"]),
      discountRub: number(row["Скидка руб"]),
      processingDateTime,
      shipmentDateTime,
      deliveryDateTime,
      cancellationDateTime,
      processingHours: hoursBetween(processingDateTime, shipmentDateTime),
      isCancelled,
      isDelivered,
      isBuyout,
    });
  });
}

function normalizeWbSupplierGoods(rows: Row[], sourceFile: string): NormalizedRecord[] {
  return rows.map((row, index) =>
    baseRecord({
      id: `wb-goods-${sourceFile}-${index}`,
      sourceFile,
      sourceType: "wb_supplier_goods",
      marketplace: "wildberries",
      brand: text(row["Бренд"]),
      category: text(row["Предмет"]),
      productName: text(row["Наименование"]),
      sellerArticle: text(row["Артикул продавца"]),
      sku: text(row["Артикул WB"]),
      barcode: text(row["Баркод"]),
      warehouse: text(row["Склад"]),
      ordersQty: number(row["шт."]),
      buyoutQty: number(row["Выкупили, шт."]),
      deliveredQty: number(row["Выкупили, шт."]),
      stockQty: number(row["Текущий остаток, шт."]),
      grossRevenue: number(row["Сумма заказов минус комиссия WB, руб."]),
      netRevenue: number(row["К перечислению за товар, руб."]),
      isDelivered: number(row["Выкупили, шт."]) > 0,
      isBuyout: number(row["Выкупили, шт."]) > 0,
    }),
  );
}

function normalizeWbDailyReport(rows: Row[], sourceFile: string): NormalizedRecord[] {
  return rows.map((row, index) => {
    const buyoutQty = number(row["Выкупили, шт."]);
    return baseRecord({
      id: `wb-report-${sourceFile}-${index}`,
      sourceFile,
      sourceType: "wb_daily_report",
      marketplace: "wildberries",
      date: dateOnly(parseDateTime(row["День"])),
      week: nullableNumber(row["Неделя года"]),
      brand: text(row["Бренд"]),
      sellerArticle: text(row["Артикул продавца"]),
      ordersQty: number(row["Заказано, шт."]),
      buyoutQty,
      deliveredQty: buyoutQty,
      grossRevenue: number(row["Сумма заказов минус комиссия WB, руб."]),
      netRevenue: number(row["К перечислению за товар, руб."]),
      isDelivered: buyoutQty > 0,
      isBuyout: buyoutQty > 0,
    });
  });
}

function baseRecord(overrides: Partial<NormalizedRecord> & Pick<NormalizedRecord, "id" | "sourceFile" | "sourceType" | "marketplace">): NormalizedRecord {
  return {
    id: overrides.id,
    sourceFile: overrides.sourceFile,
    marketplace: overrides.marketplace,
    sourceType: overrides.sourceType,
    date: overrides.date ?? null,
    week: overrides.week ?? null,
    brand: overrides.brand ?? null,
    category: overrides.category ?? null,
    productName: overrides.productName ?? null,
    sellerArticle: overrides.sellerArticle ?? null,
    sku: overrides.sku ?? null,
    barcode: overrides.barcode ?? null,
    warehouse: overrides.warehouse ?? null,
    region: overrides.region ?? null,
    city: overrides.city ?? null,
    deliveryCluster: overrides.deliveryCluster ?? null,
    shippingCluster: overrides.shippingCluster ?? null,
    deliveryMethod: overrides.deliveryMethod ?? null,
    status: overrides.status ?? null,
    ordersQty: overrides.ordersQty ?? 0,
    buyoutQty: overrides.buyoutQty ?? 0,
    deliveredQty: overrides.deliveredQty ?? 0,
    cancelledQty: overrides.cancelledQty ?? 0,
    stockQty: overrides.stockQty ?? 0,
    grossRevenue: overrides.grossRevenue ?? 0,
    netRevenue: overrides.netRevenue ?? 0,
    paidByCustomer: overrides.paidByCustomer ?? 0,
    itemPrice: overrides.itemPrice ?? 0,
    discountRub: overrides.discountRub ?? 0,
    processingDateTime: overrides.processingDateTime ?? null,
    shipmentDateTime: overrides.shipmentDateTime ?? null,
    deliveryDateTime: overrides.deliveryDateTime ?? null,
    cancellationDateTime: overrides.cancellationDateTime ?? null,
    processingHours: overrides.processingHours ?? null,
    isCancelled: overrides.isCancelled ?? false,
    isDelivered: overrides.isDelivered ?? false,
    isBuyout: overrides.isBuyout ?? false,
  };
}

function parseDateTime(value: unknown): string | null {
  if (value instanceof Date && isValid(value)) {
    return value.toISOString();
  }

  const raw = text(value);
  if (!raw) return null;

  const candidates = [
    parseISO(raw),
    parse(raw, "yyyy-MM-dd HH:mm:ss", new Date()),
    parse(raw, "yyyy-MM-dd", new Date()),
    parse(raw, "M/d/yy", new Date()),
    parse(raw, "dd.MM.yyyy", new Date()),
  ];
  const parsed = candidates.find(isValid);
  return parsed ? parsed.toISOString() : null;
}

function dateOnly(value: string | null): string | null {
  if (!value) return null;
  const parsed = parseISO(value);
  return isValid(parsed) ? format(parsed, "yyyy-MM-dd") : null;
}

function hoursBetween(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;
  const startDate = parseISO(start);
  const endDate = parseISO(end);
  if (!isValid(startDate) || !isValid(endDate)) return null;
  return Math.max(0, differenceInHours(endDate, startDate));
}

function text(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : null;
}

function number(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const normalized = String(value ?? "")
    .replace("%", "")
    .replace(/\s/g, "")
    .replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function nullableNumber(value: unknown): number | null {
  const parsed = number(value);
  return parsed === 0 && !String(value ?? "").match(/0/) ? null : parsed;
}

function truthy(value: unknown): boolean {
  const raw = String(value ?? "").trim().toLowerCase();
  return ["true", "1", "да", "yes", "y"].includes(raw);
}

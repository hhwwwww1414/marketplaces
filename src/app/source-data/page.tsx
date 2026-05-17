import { FileSpreadsheet } from "lucide-react";
import { getAnalytics } from "@/lib/analytics";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { NormalizedRecord } from "@/lib/types";

export default function SourceDataPage() {
  const { records } = getAnalytics();
  const sample = records.slice(0, 120);

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">Данные для оценки</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950">Показатели по заказам и товарам</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          Раздел показывает обезличенную витрину данных, которая используется для расчета спроса,
          выкупов, отмен, выручки и складских остатков. Персональные данные покупателей не отображаются.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Stat label="Записей" value={formatNumber(records.length)} />
        <Stat label="Ozon" value={formatNumber(records.filter((record) => record.marketplace === "ozon").length)} />
        <Stat label="Wildberries" value={formatNumber(records.filter((record) => record.marketplace === "wildberries").length)} />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
          <FileSpreadsheet className="size-5 text-cyan-700" aria-hidden="true" />
          <h2 className="text-base font-semibold text-slate-950">Нормализованные записи</h2>
        </div>
        {sample.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Дата</th>
                  <th className="px-5 py-3 font-medium">Маркетплейс</th>
                  <th className="px-5 py-3 font-medium">Направление</th>
                  <th className="px-5 py-3 font-medium">Товар</th>
                  <th className="px-5 py-3 font-medium">Склад/регион</th>
                  <th className="px-5 py-3 font-medium">Заказы</th>
                  <th className="px-5 py-3 font-medium">Выкупы</th>
                  <th className="px-5 py-3 font-medium">Чистая выручка</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sample.map((record) => (
                  <tr key={record.id}>
                    <td className="px-5 py-3 text-slate-600">{record.date ?? "—"}</td>
                    <td className="px-5 py-3 font-medium text-slate-900">{marketplaceLabel(record.marketplace)}</td>
                    <td className="px-5 py-3 text-slate-600">{sourceLabel(record)}</td>
                    <td className="max-w-[260px] px-5 py-3 text-slate-600">{record.productName ?? record.sellerArticle ?? "—"}</td>
                    <td className="px-5 py-3 text-slate-600">{record.warehouse ?? record.region ?? "—"}</td>
                    <td className="px-5 py-3 text-slate-600">{formatNumber(record.ordersQty)}</td>
                    <td className="px-5 py-3 text-slate-600">{formatNumber(record.buyoutQty)}</td>
                    <td className="px-5 py-3 text-slate-600">{formatCurrency(record.netRevenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid min-h-64 place-items-center px-6 text-center text-sm text-slate-500">
            Данные для оценки пока не подготовлены.
          </div>
        )}
      </section>
    </div>
  );
}

function marketplaceLabel(marketplace: NormalizedRecord["marketplace"]) {
  return marketplace === "ozon" ? "Ozon" : "Wildberries";
}

function sourceLabel(record: NormalizedRecord) {
  if (record.sourceType === "ozon_orders") return "Заказы";
  if (record.sourceType === "wb_supplier_goods") return "Товары и остатки";
  return "Продажи по дням";
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

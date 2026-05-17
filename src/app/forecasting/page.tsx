import { ForecastChart } from "@/components/forecast-chart";
import { getAnalytics } from "@/lib/analytics";
import { formatCurrency, formatNumber, scenarioLabel } from "@/lib/format";

export default function ForecastingPage() {
  const { forecast } = getAnalytics();

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">Сценарный прогноз</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950">Сценарный прогноз реализации</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          Инструмент строит простой прогноз по коэффициентам 0.85 / 1 / 1.15 для заказов, выкупов,
          чистой выручки и итоговой оценки проекта.
        </p>
      </section>

      <ForecastChart data={forecast} />

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">Сценарии</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-3 pr-4 font-medium">Сценарий</th>
                <th className="py-3 pr-4 font-medium">Коэффициент</th>
                <th className="py-3 pr-4 font-medium">Заказы</th>
                <th className="py-3 pr-4 font-medium">Выкупы</th>
                <th className="py-3 pr-4 font-medium">Чистая выручка</th>
                <th className="py-3 pr-4 font-medium">Итоговая оценка</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {forecast.map((scenario) => (
                <tr key={scenario.name}>
                  <td className="py-3 pr-4 font-medium text-slate-900">{scenarioLabel(scenario.name)}</td>
                  <td className="py-3 pr-4 text-slate-600">{scenario.factor}</td>
                  <td className="py-3 pr-4 text-slate-600">{formatNumber(scenario.ordersQty)}</td>
                  <td className="py-3 pr-4 text-slate-600">{formatNumber(scenario.buyoutQty)}</td>
                  <td className="py-3 pr-4 text-slate-600">{formatCurrency(scenario.netRevenue)}</td>
                  <td className="py-3 pr-4 text-slate-600">{scenario.projectScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

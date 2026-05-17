import { Activity, BadgeCheck, CircleGauge, TriangleAlert } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { getAnalytics } from "@/lib/analytics";
import { formatNumber, formatPercent } from "@/lib/format";

export default function ProjectEvaluationPage() {
  const { projectScore, project, risks } = getAnalytics();
  const blocks = [
    { label: "Финансовый блок", value: projectScore.financialScore },
    { label: "Клиентский блок", value: projectScore.customerScore },
    { label: "Операционный блок", value: projectScore.operationalScore },
    { label: "Платформенный блок", value: projectScore.platformScore },
  ];

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">Интегральная оценка</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950">Интегральная оценка проекта</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          Итоговая оценка считается по четырем блокам показателей. ИИ-модуль не участвует в численных расчетах.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Итоговая оценка проекта</p>
          <div className="mt-5 flex items-end gap-3">
            <span className="text-7xl font-semibold tracking-normal text-slate-950">{projectScore.totalScore}</span>
            <span className="pb-2 text-xl font-medium text-slate-500">/ 100</span>
          </div>
          <p className="mt-5 text-sm leading-6 text-slate-600">{projectScore.interpretation}</p>
        </article>

        <div className="grid gap-4 md:grid-cols-2">
          {blocks.map((block) => (
            <article key={block.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-base font-semibold text-slate-950">{block.label}</h2>
                <span className="text-2xl font-semibold text-cyan-700">{block.value}</span>
              </div>
              <div className="mt-4 h-2 rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-cyan-700" style={{ width: `${block.value}%` }} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <KpiCard title="Выкуп" value={formatPercent(project.buyoutRate)} caption="Клиентский блок и качество спроса" icon={BadgeCheck} />
        <KpiCard title="Отмены" value={formatPercent(project.cancellationRate)} caption="Операционный риск реализации" icon={TriangleAlert} />
        <KpiCard title="Обработка" value={formatNumber(project.avgProcessingHours)} caption="Средние часы от обработки до отгрузки" icon={Activity} />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <CircleGauge className="size-5 text-cyan-700" aria-hidden="true" />
          <h2 className="text-base font-semibold text-slate-950">Риски, рассчитанные кодом</h2>
        </div>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
          {risks.map((risk) => (
            <li key={risk} className="rounded-md bg-slate-50 px-4 py-3">
              {risk}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

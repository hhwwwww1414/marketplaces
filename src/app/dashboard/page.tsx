import { DetailedDashboard } from "@/components/detailed-dashboard";
import { getAnalytics } from "@/lib/analytics";

export default function DashboardPage() {
  const analytics = getAnalytics();

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">Сводка показателей</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950">Детальный аналитический дашборд</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          Раздел позволяет рассматривать проект на разных уровнях: по площадкам, периодам,
          направлениям данных, товарам, складам и регионам. Все расчеты строятся по обезличенной
          витрине и помогают увидеть не только итог, но и причины изменения результата.
        </p>
      </section>

      <DetailedDashboard records={analytics.records} />
    </div>
  );
}

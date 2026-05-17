import { LlmClient } from "@/components/llm-client";
import { getAnalytics } from "@/lib/analytics";

export default function LlmAnalystPage() {
  const { llmPayload } = getAnalytics();

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">ИИ-анализ</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950">Управленческая интерпретация результатов</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          ИИ получает только агрегированные показатели: итоговую оценку, изменения по периодам,
          прогноз и рассчитанные риски. Персональные данные и строки заказов в анализ не передаются.
        </p>
      </section>

      <LlmClient payload={llmPayload} />
    </div>
  );
}

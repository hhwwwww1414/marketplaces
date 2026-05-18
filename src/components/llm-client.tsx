"use client";

import { useState } from "react";
import { Bot, CheckCircle2, Loader2, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { SanitizedAnalyticsPayload } from "@/lib/types";

type LlmClientProps = {
  payload: SanitizedAnalyticsPayload;
};

export function LlmClient({ payload }: LlmClientProps) {
  const [content, setContent] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function analyze() {
    setLoading(true);
    setError("");
    setContent("");

    const response = await fetch("/api/llm/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "project_evaluation", payload }),
    });
    const result = (await response.json()) as { ok: boolean; content?: string; error?: string };
    setLoading(false);

    if (!result.ok) {
      setError(result.error ?? "Не удалось получить ИИ-интерпретацию.");
      return;
    }
    setContent(result.content ?? "");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-950">Управленческая интерпретация</h2>
            <p className="mt-1 text-sm text-slate-500">В ИИ-анализ отправляются только обобщенные бизнес-показатели.</p>
          </div>
          <button
            type="button"
            onClick={analyze}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
            Запросить анализ
          </button>
        </div>

        {error ? (
          <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">{error}</div>
        ) : null}

        {content ? (
          <article className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-800">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => <h1 className="mb-4 text-xl font-semibold leading-8 text-slate-950">{children}</h1>,
                h2: ({ children }) => (
                  <h2 className="mb-3 mt-6 border-b border-slate-200 pb-2 text-base font-semibold leading-7 text-slate-950 first:mt-0">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => <h3 className="mb-2 mt-5 text-sm font-semibold uppercase tracking-[0.08em] text-cyan-800">{children}</h3>,
                p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold text-slate-950">{children}</strong>,
                ul: ({ children }) => <ul className="mb-5 list-disc space-y-2 pl-5 last:mb-0">{children}</ul>,
                ol: ({ children }) => <ol className="mb-5 list-decimal space-y-3 pl-5 last:mb-0">{children}</ol>,
                li: ({ children }) => <li className="pl-1">{children}</li>,
                hr: () => <hr className="my-5 border-slate-200" />,
                table: ({ children }) => (
                  <div className="my-5 overflow-x-auto rounded-md border border-slate-200 bg-white">
                    <table className="min-w-full border-collapse text-left text-sm">{children}</table>
                  </div>
                ),
                thead: ({ children }) => <thead className="bg-slate-100 text-slate-700">{children}</thead>,
                th: ({ children }) => <th className="border-b border-slate-200 px-4 py-3 font-semibold">{children}</th>,
                td: ({ children }) => <td className="border-t border-slate-100 px-4 py-3 align-top">{children}</td>,
              }}
            >
              {content}
            </ReactMarkdown>
          </article>
        ) : (
          <div className="mt-5 grid min-h-56 place-items-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-center">
            <div className="max-w-sm px-6">
              <Bot className="mx-auto size-8 text-slate-400" aria-hidden="true" />
              <p className="mt-3 text-sm font-medium text-slate-700">Ответ ИИ-аналитика появится здесь</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">Расчеты уже выполнены кодом; модель только объясняет результат.</p>
            </div>
          </div>
        )}
      </section>

      <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">Что учитывает анализ</h2>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
          {[
            "итоговую оценку проекта",
            "финансовый, клиентский, операционный и платформенный блоки",
            "сравнение базового и проектного периодов",
            "сценарный прогноз",
            "риски, рассчитанные по показателям",
          ].map((item) => (
            <li key={item} className="flex gap-3 rounded-md bg-slate-50 px-4 py-3">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-cyan-700" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

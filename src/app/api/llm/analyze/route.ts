import { NextResponse } from "next/server";
import { z } from "zod";
import { sanitizeForLLM } from "@/lib/privacy";

const DISABLED_MESSAGE =
  "ИИ-модуль отключен: не найден ключ OpenRouter. Расчеты и аналитические разделы доступны без ИИ.";

const requestSchema = z.object({
  mode: z.enum(["project_evaluation", "forecast", "dashboard"]),
  payload: z.unknown(),
});

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Некорректный запрос к ИИ-модулю." }, { status: 400 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: DISABLED_MESSAGE }, { status: 200 });
  }

  const baseUrl = process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";
  const model = process.env.OPENROUTER_MODEL ?? "minimax/minimax-m2.5:free";
  const payload = sanitizeForLLM(parsed.data.payload);

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://vercel.app",
      "X-Title": process.env.NEXT_PUBLIC_APP_NAME ?? "Инструмент оценки проектов на маркетплейсах",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "Ты аналитик проектной оценки маркетплейс-инициатив. Не пересчитывай показатели, используй только переданные агрегаты. Не запрашивай персональные данные и не делай выводов по сырым строкам заказов.",
        },
        {
          role: "user",
          content: [
            `Режим анализа: ${parsed.data.mode}.`,
            "Подготовь краткую управленческую интерпретацию: сильные стороны, риски, прогноз и 3 практические рекомендации.",
            JSON.stringify(payload),
          ].join("\n\n"),
        },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ ok: false, error: "OpenRouter вернул ошибку. Проверьте ключ и модель." }, { status: 502 });
  }

  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return NextResponse.json({ ok: true, content: data.choices?.[0]?.message?.content ?? "" });
}

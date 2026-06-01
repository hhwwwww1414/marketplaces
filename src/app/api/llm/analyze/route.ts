import { NextResponse } from "next/server";
import { z } from "zod";
import { sanitizeForLLM } from "@/lib/privacy";

const DISABLED_MESSAGE =
  "ИИ-модуль отключен: не найден ключ OpenRouter. Расчеты и аналитические разделы доступны без ИИ.";
const OPENROUTER_ERROR_MESSAGE = "OpenRouter вернул ошибку. Проверьте ключ и модель.";
const OPENROUTER_UNAVAILABLE_MESSAGE = "OpenRouter недоступен. Попробуйте повторить запрос позже.";
const OPENROUTER_INVALID_RESPONSE_MESSAGE =
  "OpenRouter вернул некорректный ответ. Попробуйте повторить запрос или выбрать другую модель.";
const DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_OPENROUTER_APP_TITLE = "Marketplace project evaluation tool";

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

  const baseUrl = normalizeBaseUrl(process.env.OPENROUTER_BASE_URL);
  const model = process.env.OPENROUTER_MODEL ?? "deepseek/deepseek-chat-v3.1:free";
  const payload = sanitizeForLLM(parsed.data.payload);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://vercel.app",
        "X-Title": normalizeHeaderTitle(process.env.NEXT_PUBLIC_APP_NAME),
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
  } catch (error) {
    console.error("OpenRouter request failed", error);
    return NextResponse.json({ ok: false, error: OPENROUTER_UNAVAILABLE_MESSAGE }, { status: 502 });
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("OpenRouter returned an error", {
      status: response.status,
      statusText: response.statusText,
      model,
      body: detail.slice(0, 2000),
    });
    return NextResponse.json(
      { ok: false, error: OPENROUTER_ERROR_MESSAGE, detail: extractOpenRouterError(detail) },
      { status: 502 },
    );
  }

  let data: { choices?: Array<{ message?: { content?: string } }> };
  try {
    data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  } catch (error) {
    console.error("OpenRouter returned invalid JSON", error);
    return NextResponse.json({ ok: false, error: OPENROUTER_INVALID_RESPONSE_MESSAGE }, { status: 502 });
  }

  return NextResponse.json({ ok: true, content: repairMojibake(data.choices?.[0]?.message?.content ?? "") });
}

function normalizeBaseUrl(value: string | undefined): string {
  const baseUrl = (value ?? DEFAULT_OPENROUTER_BASE_URL).trim().replace(/^['"]|['"]$/g, "").replace(/\/+$/, "");

  try {
    const url = new URL(baseUrl);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString().replace(/\/+$/, "");
    }
  } catch {
    console.error("Invalid OPENROUTER_BASE_URL, using default OpenRouter URL.");
  }

  return DEFAULT_OPENROUTER_BASE_URL;
}

function normalizeHeaderTitle(value: string | undefined): string {
  const title = (value ?? DEFAULT_OPENROUTER_APP_TITLE).trim();

  if (/^[\x20-\x7e]+$/.test(title)) {
    return title;
  }

  return DEFAULT_OPENROUTER_APP_TITLE;
}

function extractOpenRouterError(body: string): string | undefined {
  if (!body) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(body) as { error?: { message?: string } | string };
    if (typeof parsed.error === "string") {
      return parsed.error;
    }
    if (parsed.error?.message) {
      return parsed.error.message;
    }
  } catch {
    // fall through to raw text
  }

  return body.slice(0, 300);
}

function repairMojibake(value: string): string {
  if (!/[ÐÑÂâ]/.test(value)) {
    return value;
  }

  try {
    const bytes = Uint8Array.from(value, (char) => char.charCodeAt(0) & 0xff);
    const repaired = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return countCyrillic(repaired) > countCyrillic(value) ? repaired : value;
  } catch {
    return value;
  }
}

function countCyrillic(value: string): number {
  return [...value].filter((char) => /[А-Яа-яЁё]/.test(char)).length;
}

import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/llm/analyze/route";

describe("LLM analyze route", () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
  });

  it("returns JSON when OpenRouter cannot be reached", async () => {
    process.env = {
      ...originalEnv,
      OPENROUTER_API_KEY: "test-key",
      OPENROUTER_MODEL: "test-model",
      OPENROUTER_BASE_URL: "https://openrouter.example/v1",
    };
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const response = await POST(
      new Request("https://example.test/api/llm/analyze", {
        method: "POST",
        body: JSON.stringify({ mode: "project_evaluation", payload: { projectScore: { totalScore: 70 } } }),
      }),
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({ ok: false });
  });

  it("returns JSON when OpenRouter sends an invalid response body", async () => {
    process.env = {
      ...originalEnv,
      OPENROUTER_API_KEY: "test-key",
      OPENROUTER_MODEL: "test-model",
      OPENROUTER_BASE_URL: "https://openrouter.example/v1",
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("not-json", { status: 200, headers: { "Content-Type": "text/plain" } })),
    );

    const response = await POST(
      new Request("https://example.test/api/llm/analyze", {
        method: "POST",
        body: JSON.stringify({ mode: "project_evaluation", payload: { projectScore: { totalScore: 70 } } }),
      }),
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({ ok: false });
  });

  it("normalizes a quoted OpenRouter base URL from environment variables", async () => {
    process.env = {
      ...originalEnv,
      OPENROUTER_API_KEY: "test-key",
      OPENROUTER_MODEL: "test-model",
      OPENROUTER_BASE_URL: '"https://openrouter.example/v1/"',
    };
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        choices: [{ message: { content: "analysis" } }],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      new Request("https://example.test/api/llm/analyze", {
        method: "POST",
        body: JSON.stringify({ mode: "project_evaluation", payload: { projectScore: { totalScore: 70 } } }),
      }),
    );

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith("https://openrouter.example/v1/chat/completions", expect.any(Object));
  });

  it("does not send non-ASCII characters in OpenRouter headers", async () => {
    process.env = {
      ...originalEnv,
      OPENROUTER_API_KEY: "test-key",
      OPENROUTER_MODEL: "test-model",
      OPENROUTER_BASE_URL: "https://openrouter.example/v1",
      NEXT_PUBLIC_APP_NAME: "Инструмент оценки проектов на маркетплейсах",
    };
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        choices: [{ message: { content: "analysis" } }],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      new Request("https://example.test/api/llm/analyze", {
        method: "POST",
        body: JSON.stringify({ mode: "project_evaluation", payload: { projectScore: { totalScore: 70 } } }),
      }),
    );

    const [, init] = fetchMock.mock.calls[0] as [string, { headers: Record<string, string> }];

    expect(response.status).toBe(200);
    expect(init.headers["X-Title"]).toMatch(/^[\x20-\x7e]+$/);
  });

  it("repairs mojibake text returned by an OpenRouter model", async () => {
    process.env = {
      ...originalEnv,
      OPENROUTER_API_KEY: "test-key",
      OPENROUTER_MODEL: "test-model",
      OPENROUTER_BASE_URL: "https://openrouter.example/v1",
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          choices: [{ message: { content: "Ð£Ð¿ÑÐ°Ð²Ð»ÐµÐ½ÑÐµÑÐºÐ°Ñ Ð¸Ð½ÑÐµÑÐ¿ÑÐµÑÐ°ÑÐ¸Ñ" } }],
        }),
      ),
    );

    const response = await POST(
      new Request("https://example.test/api/llm/analyze", {
        method: "POST",
        body: JSON.stringify({ mode: "project_evaluation", payload: { projectScore: { totalScore: 70 } } }),
      }),
    );

    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      content: "Управленческая интерпретация",
    });
  });
});

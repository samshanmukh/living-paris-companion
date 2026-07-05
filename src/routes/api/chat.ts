import { createFileRoute } from "@tanstack/react-router";
import { CONCIERGE_SYSTEM } from "@/lib/conciergePrompt";
import { normalizeConciergeResponse } from "@/lib/concierge";
import type { GuestProfile, IntentQuery } from "@/lib/types";

const DEFAULT_MODEL = "google/gemini-2.5-flash";

function gatewayConfig() {
  if (process.env.LOVABLE_API_KEY) {
    return {
      url: "https://ai.gateway.lovable.dev/v1/chat/completions",
      key: process.env.LOVABLE_API_KEY,
      model: process.env.CHAT_MODEL ?? DEFAULT_MODEL,
    };
  }
  if (process.env.OPENROUTER_API_KEY) {
    return {
      url: "https://openrouter.ai/api/v1/chat/completions",
      key: process.env.OPENROUTER_API_KEY,
      model: process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL,
    };
  }
  return null;
}

function errResp(reason: string, status = 502) {
  return Response.json(
    {
      error: true,
      reason,
      reply: `Give me a moment — I'm gathering myself (${reason}).`,
      query: { mood: "general" },
      actions: [],
    },
    { status },
  );
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const gw = gatewayConfig();
        if (!gw) return errResp("missing API key", 500);

        let body: {
          messages: { role: string; content: string }[];
          profile?: GuestProfile;
          guestContext?: string;
        };
        try {
          body = await request.json();
        } catch {
          return errResp("bad body", 400);
        }

        const contextBlock = body.guestContext
          ? `\n\nCURRENT GUEST CONTEXT (merge, do not repeat verbatim):\n${body.guestContext}`
          : "";

        try {
          const r = await fetch(gw.url, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${gw.key}`,
              "Content-Type": "application/json",
              ...(gw.url.includes("openrouter")
                ? { "HTTP-Referer": "https://living-paris.app", "X-Title": "Living Paris" }
                : {}),
            },
            body: JSON.stringify({
              model: gw.model,
              messages: [
                { role: "system", content: CONCIERGE_SYSTEM + contextBlock },
                ...body.messages,
              ],
              temperature: 0.75,
            }),
          });

          if (!r.ok) {
            const txt = await r.text().catch(() => "");
            console.error("chat gateway", r.status, txt.slice(0, 300));
            if (r.status === 429) return errResp("rate limited", 429);
            return errResp(`gateway ${r.status}`, 502);
          }

          const data = await r.json();
          const content: string = data.choices?.[0]?.message?.content ?? "";
          const match = content.match(/\{[\s\S]*\}/);
          try {
            const parsed = JSON.parse(match ? match[0] : content) as Record<string, unknown>;
            const normalized = normalizeConciergeResponse(parsed);
            return Response.json(normalized);
          } catch {
            return Response.json({
              reply:
                content.replace(/[#*`]/g, "").slice(0, 400) ||
                "I'm here — what kind of Paris do you want today?",
              query: { mood: "general" } satisfies Partial<IntentQuery>,
              actions: [],
            });
          }
        } catch (e) {
          console.error("chat handler error", e);
          return errResp("request failed");
        }
      },
    },
  },
});

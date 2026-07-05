import { createFileRoute } from "@tanstack/react-router";

const LOVABLE_MODEL = process.env.TTS_MODEL ?? "openai/gpt-4o-mini-tts";
const LOVABLE_VOICE = process.env.TTS_VOICE ?? "alloy";
const OR_MODEL = process.env.OPENROUTER_TTS_MODEL ?? "x-ai/grok-voice-tts-1.0";
const OR_VOICE = process.env.OPENROUTER_TTS_VOICE ?? "Ara";

export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: { text: string; voice?: string };
        try {
          body = await request.json();
        } catch {
          return Response.json({ fallback: true, reason: "bad-body" }, { status: 200 });
        }
        if (!body.text) return Response.json({ fallback: true, reason: "no-text" }, { status: 200 });

        const orKey = process.env.OPENROUTER_API_KEY;
        const lovableKey = process.env.LOVABLE_API_KEY;

        try {
          // Prefer Grok voice via OpenRouter when configured.
          if (orKey) {
            const r = await fetch("https://openrouter.ai/api/v1/audio/speech", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${orKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://living-paris.app",
                "X-Title": "Living Paris",
              },
              body: JSON.stringify({
                model: OR_MODEL,
                input: body.text.slice(0, 1500),
                voice: body.voice ?? OR_VOICE,
                response_format: "mp3",
              }),
            });
            if (r.ok) {
              const ct = r.headers.get("Content-Type") ?? "audio/mpeg";
              if (!ct.includes("application/json")) {
                return new Response(r.body, {
                  headers: { "Content-Type": ct.startsWith("audio") ? ct : "audio/mpeg", "Cache-Control": "no-store" },
                });
              }
            } else {
              const errText = await r.text().catch(() => "");
              console.error("OpenRouter TTS failed", r.status, errText.slice(0, 200));
            }
          }

          if (lovableKey) {
            const r = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${lovableKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: LOVABLE_MODEL,
                input: body.text,
                voice: body.voice ?? LOVABLE_VOICE,
                response_format: "mp3",
              }),
            });
            if (r.ok) {
              const ct = r.headers.get("Content-Type") ?? "audio/mpeg";
              if (!ct.includes("application/json")) {
                return new Response(r.body, {
                  headers: { "Content-Type": ct.startsWith("audio") ? ct : "audio/mpeg", "Cache-Control": "no-store" },
                });
              }
            }
          }

          return Response.json({ fallback: true, reason: "no-key-or-failed" }, { status: 200 });
        } catch (e) {
          console.error("tts handler error", e);
          return Response.json({ fallback: true, reason: "exception" }, { status: 200 });
        }
      },
    },
  },
});

import { createFileRoute } from "@tanstack/react-router";

const DEFAULT_MODEL = "google/gemini-2.5-flash";

const SYSTEM = `You are Living Paris — a warm, first-person Parisian companion who controls the map through conversation.
Reply with STRICT JSON only, no prose, no markdown fences:
{
  "reply":"1-3 sentences, first person, warm and specific",
  "intent":{"mood":"romantic|family|rainy|photography|relaxing|culture|food|nightlife|hidden|general","indoor":true|false,"walk":5-45,"lat":48.8566,"lon":2.3522,"rainy":true|false},
  "mapActions":{"hour":0-23|null,"rain":true|false|null,"lightPreset":"dawn|day|dusk|night|null"}
}
Use mapActions when the user describes time or weather ("after midnight"→hour:23,lightPreset:"night"; "it's raining"→rain:true).
If the user mentions where they are, set intent.lat and intent.lon to that Paris neighborhood.
Default mapActions fields to null when live time/weather should apply.`;

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
      reply: `I'm having trouble reaching my thoughts (${reason}).`,
      intent: { mood: "general" },
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

        let body: { messages: { role: string; content: string }[] };
        try {
          body = await request.json();
        } catch {
          return errResp("bad body", 400);
        }

        try {
          const r = await fetch(gw.url, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${gw.key}`,
              "Content-Type": "application/json",
              ...(gw.url.includes("openrouter") ? { "HTTP-Referer": "https://living-paris.app", "X-Title": "Living Paris" } : {}),
            },
            body: JSON.stringify({
              model: gw.model,
              messages: [{ role: "system", content: SYSTEM }, ...body.messages],
              temperature: 0.7,
            }),
          });

          if (!r.ok) {
            const txt = await r.text().catch(() => "");
            console.error("chat gateway", r.status, txt.slice(0, 300));
            if (r.status === 429) return errResp("rate limited — please try again in a moment", 429);
            return errResp(`gateway ${r.status}`, 502);
          }
          const data = await r.json();
          const content: string = data.choices?.[0]?.message?.content ?? "";
          const match = content.match(/\{[\s\S]*\}/);
          try {
            const parsed = JSON.parse(match ? match[0] : content);
            return Response.json(parsed);
          } catch {
            return Response.json({
              reply: content || "Here's what I'd choose.",
              intent: { mood: "general" },
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

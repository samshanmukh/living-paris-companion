import { createFileRoute } from "@tanstack/react-router";

type WikiSearchResp = {
  query?: {
    pages?: Record<string, { pageimage?: string; thumbnail?: { source?: string }; title?: string }>;
  };
};

async function wikiThumb(query: string): Promise<string | null> {
  const url =
    "https://en.wikipedia.org/w/api.php?" +
    new URLSearchParams({
      action: "query",
      generator: "search",
      gsrsearch: query,
      gsrlimit: "1",
      prop: "pageimages",
      piprop: "thumbnail",
      pithumbsize: "400",
      format: "json",
      origin: "*",
    }).toString();
  try {
    const r = await fetch(url, { headers: { "User-Agent": "LivingParis/1.0" } });
    if (!r.ok) return null;
    const data = (await r.json()) as WikiSearchResp;
    const pages = data.query?.pages ?? {};
    for (const k of Object.keys(pages)) {
      const src = pages[k]?.thumbnail?.source;
      if (src) return src;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export const Route = createFileRoute("/api/place-image")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const u = new URL(request.url);
        const name = (u.searchParams.get("name") ?? "").trim();
        const type = (u.searchParams.get("type") ?? "").trim();
        if (!name) return Response.json({ image: null }, { status: 200 });

        const attempts = [
          `${name} Paris`,
          type ? `${name} ${type} Paris` : "",
          name,
        ].filter(Boolean);

        for (const q of attempts) {
          const img = await wikiThumb(q);
          if (img) {
            return new Response(JSON.stringify({ image: img }), {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "public, max-age=86400",
              },
            });
          }
        }
        // Fallback: Unsplash Source (no key) themed by query.
        const q = encodeURIComponent(`${name} ${type} Paris`.trim());
        return Response.json({ image: `https://source.unsplash.com/400x300/?${q}` });
      },
    },
  },
});

# Living Paris

**Have a conversation with Paris.**

Living Paris is a voice-first AI city companion for Paris. Describe the day you want — romantic, rainy, with kids, something hidden — and the map reshapes around you: mood-driven lighting, curated places, walking routes, and a cinematic **Live this one** walkthrough stop by stop.

Built as a glassmorphism map experience on Mapbox Standard 3D, with a concierge that listens more than it searches.

---

## Features

- **Conversational concierge** — Text or voice; the assistant learns your mood, constraints, and preferences over a few warm exchanges (not a questionnaire).
- **Mood-driven map** — Light preset, fog, pitch, and accent colors shift with intent (romantic, food, rainy, family, hidden, etc.).
- **Live this one** — One tap to preview a route with a stop-by-stop camera tour and follow-up questions from the assistant.
- **Live Paris sky** — Sun/moon indicator and local time in the badge; time-accurate 3D sun position and building shadows on the map.
- **Live weather** — Open-Meteo drives rain/snow, day/night presets, and concierge time overrides (“make it night”).
- **Air quality layer** — Optional WAQI/aqicn.org overlay with animated tiles and station markers.
- **Guest profile & traits** — Remembers who you are across turns; syncs to Supabase when configured.
- **Demo mode** — “Demo Data” toggle shows same destination, different safest paths for different needs.

---

## Tech stack

| Layer | Tools |
| --- | --- |
| Framework | [TanStack Start](https://tanstack.com/start) + React 19 + Vite |
| Map | [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/) + react-map-gl, Standard style, 3D buildings |
| AI | OpenRouter (Grok) or Lovable AI Gateway — `/api/chat`, `/api/tts` |
| State | Zustand |
| Motion | Framer Motion |
| UI | Tailwind CSS 4, Radix, Lucide |
| Data | Curated Paris POIs, Mapbox Directions, Open-Meteo, WAQI |
| Auth / sync | Supabase (optional) |

---

## Getting started

### Prerequisites

- **Node.js** 20+
- **Mapbox** public token ([mapbox.com](https://account.mapbox.com/))
- **OpenRouter** API key **or** Lovable `LOVABLE_API_KEY` for chat/voice

### Install & run

```bash
git clone https://github.com/samshanmukh/living-paris-companion.git
cd living-paris-companion
npm install
cp .env.example .env
# Edit .env with your keys (see below)
npm run dev
```

Open the URL Vite prints (default port **8080**).

### Build

```bash
npm run build
npm run preview
```

Production builds target **Cloudflare Workers** via Nitro (see `.output/` after build).

---

## Environment variables

Copy `.env.example` to `.env`. Never commit real secrets.

### Client (browser)

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_MAPBOX_TOKEN` | Yes | Mapbox public access token |
| `VITE_SUPABASE_URL` | No | Supabase project URL (guest profile sync) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | No | Supabase anon/publishable key |
| `VITE_SUPABASE_PROJECT_ID` | No | Supabase project id |

### Server (API routes)

| Variable | Required | Description |
| --- | --- | --- |
| `OPENROUTER_API_KEY` | Yes* | Chat + TTS via OpenRouter |
| `OPENROUTER_MODEL` | No | Default: `x-ai/grok-4.3` |
| `OPENROUTER_TTS_MODEL` | No | Default: `x-ai/grok-voice-tts-1.0` |
| `OPENROUTER_TTS_VOICE` | No | Default: `Ara` |
| `LOVABLE_API_KEY` | Yes* | Alternative to OpenRouter (Lovable gateway) |
| `WAQI_API_KEY` | No | Air quality tiles from aqicn.org |
| `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` | No | Server-side Supabase (SSR) |

\*Use **either** OpenRouter **or** Lovable for AI.

For Cloudflare deploys, set server variables in the Workers dashboard or via `wrangler secret put`.

---

## Project layout

```
src/
├── components/     # Map, panels, markers, route UI
├── hooks/          # Map camera, mood map, route preview, voice
├── lib/            # Concierge, weather, sun, routing, moods
├── routes/         # TanStack routes + API handlers
│   └── api/        # chat, tts, air-quality, place-image
├── store/          # Zustand (city, scene, traits, UI)
└── styles.css      # Design tokens (cream paper, glass, moods)
```

---

## Demo script (60 seconds)

1. **Load** — 3D Paris fly-in; badge shows live time and sun/moon.
2. **Talk** — *“I'm with my partner — something romantic and walkable.”*
3. **Watch** — Mood shifts; places appear on the map.
4. **Live this one** — Cinematic stop-by-stop route preview.
5. **Demo Data** — Same destination, three different paths for different needs.

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

---

## License

Private project. All rights reserved unless otherwise noted.

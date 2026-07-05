# Living Paris — Frontend Rebuild

Complete visual + interaction rebuild of the client. No backend logic changes; all data flows keep working. Below is what I'll build, in the order I'll build it, plus the couple of contract points I need you to confirm before I start.

## Two things to confirm first

1. **Backend contract.** The current app talks to a curated in-memory POI set + Mapbox routing (`src/lib/api.ts`), and to internal TanStack API routes (`/api/chat`, `/api/place-image`, `/api/tts`). Your spec calls a separate server:
   - `POST {VITE_API_URL}/api/spatial/query` → `{ geojson, meta:{center}, totalFeatures }`
   - `POST {VITE_API_URL}/api/routes` → `{ geometry, distanceMeters, durationMinutes, legs }`

   Pick one:
   - **A. Add a new `apiClient` that calls the external server** at `VITE_API_URL` (default `http://localhost:8787`). Keep the in-memory POIs as offline fallback so the deployed preview still renders when the server is down.
   - **B. Wire the new UI to the existing `api.ts`** (POIs + Mapbox routing) and skip the external server for now.

2. **Chat panel.** Your spec describes a "command/chat panel" with mood chips + input + conversation. The current chat is wired to the LLM (`/api/chat`) and drives place suggestions. Keep the LLM conversation flow (assistant messages + clickable place chips), just redesigned — yes/no?

Defaults if you don't reply: **1A** and **yes keep LLM conversation**.

## Design tokens (src/styles.css)

Rebuilt from scratch:
- Cream paper `#F4F0E8`, ink `#1C1A16 / #5C554A / #938B7C`. No pure black/white anywhere.
- Glass token: `rgba(253,251,246,0.62)` + `backdrop-filter: blur(26px) saturate(1.25)`, 1px hairline `rgba(28,26,22,0.08)`, radius 20–24, shadow `0 12px 40px rgba(60,50,30,0.10)`.
- Type: `Instrument Serif` (emotional) + `Inter` (UI), loaded via `<link>` in `__root.tsx`.
- Accent palette as CSS vars keyed by mood — **exactly one active at a time**, applied to markers, route line, active chip, tags. Structural surfaces stay cream+ink.
- Spacing scale 4/8/12/16/24/32. Lucide icons at 20px, `strokeWidth={1.5}`.
- Reset shadcn tokens to map onto the cream/ink system.

## Layout shell (src/routes/index.tsx)

Full-bleed Mapbox behind everything. Floating glass regions:
- **Left**: `CommandPanel` — 340px wide, inset 24px, top→bottom: brand mark, serif hero prompt "What kind of Paris are you in the mood for?", conversation transcript, mood chip row, rounded input bar w/ mic button. Bottom-sheet on mobile.
- **Bottom-right**: `ResultRail` — horizontal scroll of glass result cards.
- **Bottom-right controls stack**: `MapControls` — recenter Paris, my-location, zoom +/–, 2D/3D toggle.
- **Selected place**: `PlaceSheet` — slide-up detail (photo, rating + reviews, AI summary, why-it-fits, hours, accessibility badges, "Start route").
- **States**: empty, loading skeletons on cards, error banner with retry.

## Map (src/components/MapCanvas.tsx)

`react-map-gl` on `mapbox://styles/mapbox/standard`, pitch 55 default, 3D buildings on.
- `flyTo` with cubic ease on results load + place selection (never jump-cut).
- `PulseMarker` — glass dot + soft pulse ring, spring-pop stagger on entry, enlarges when selected. Two-way sync: hovering/selecting a card highlights the marker and vice versa (Zustand `hoveredId` / `selectedId`).
- Clustering (Mapbox `cluster: true` source) when zoomed out; cluster bubbles are glass with count.
- `RouteLayer` — animated `line-dasharray` draw-in over ~1.4s using accent color; distance + duration chip anchored to the line midpoint.
- `prefers-reduced-motion` disables pulse, draw-in, and easing → uses `jumpTo`.

## Motion (framer-motion)

- Springs: `soft {120,18}` and `pop {300,20}`. Durations 0.25–0.8s.
- Panel slides in (soft), chips stagger-pop (pop, 30ms stagger), cards rise+stagger (soft, 60ms), markers spring-pop staggered.
- Buttons `whileTap={{ scale: 0.97 }}`.
- **Mood change**: `document.documentElement.style.setProperty('--accent', mood.color)` inside a `motion` transition so chips/markers/route/tags all re-tint smoothly while ink text stays constant. This is the "city adapts" moment.

## Components (rebuilt)

Kept file names where possible; internals rewritten.

- `MapCanvas.tsx` — 3D basemap, markers, clusters, route, control stack.
- `Marker.tsx` — `PulseMarker` (glass dot + pulse), `ClusterMarker`.
- `RouteLayer.tsx` — animated line + distance/duration chip.
- `MapControls.tsx` **(new)** — recenter / geolocate / zoom / 2D-3D.
- `CommandPanel.tsx` **(new, replaces `ChatPanel`)** — brand, hero prompt, transcript, chips, input.
- `MoodChips.tsx` — pill row, single-active, staggered.
- `InputBar.tsx` — rounded glass, mic button, submit.
- `MessageBubble.tsx` — assistant = no background (per chat-ui rules), user = ink-on-cream card. Place suggestions render as inline `PlaceChip` cards that select on map.
- `ResultRail.tsx` **(new, replaces `ResultCards`)** — horizontal glass cards with name (serif), category, rating, AI reason, "12 min walk" tag.
- `PlaceSheet.tsx` **(rewritten from `PlaceDetail`)** — slide-up detail sheet, photo, rating + reviews, AI summary, "why it fits your vibe", hours, accessibility badges, Start route.
- `ThinkingIndicator.tsx` — AI Elements `Shimmer` "Thinking…".
- `Skeleton.tsx` **(new)** — result-card + sheet skeleton.
- `ErrorBanner.tsx` **(new)** — "Couldn't reach Paris — retry".
- Delete: `BrandPill.tsx`, `AmbientCard.tsx`, `Onboarding.tsx`, `FavoritesPanel.tsx`, `SettingsMenu.tsx` (folded into new controls; favorites re-added as a small button in `MapControls` if you want it — say the word).

## State (src/store/useCityStore.ts)

Extend the existing store: `mood`, `results`, `selectedId`, `hoveredId`, `route`, `loading`, `error`. Actions: `setMood`, `runQuery`, `selectPlace`, `hoverPlace`, `startRoute`, `retry`. Mood setter also writes `--accent` on `:root`.

## API layer

If **1A**: new `src/lib/apiClient.ts` with `spatialQuery()` and `getRoute()` hitting `VITE_API_URL`, typed against your response shapes; falls back to the current in-memory POIs on network failure.
If **1B**: keep `src/lib/api.ts`, add typed adapter so the new UI consumes a uniform `Place` + `Route` shape.

## Accessibility & responsive

- Full keyboard nav: chip row = arrow keys, input focus ring, sheet Esc-closes, focus trap inside sheet.
- SR labels on every icon button.
- ≤900px: `CommandPanel` becomes a bottom sheet (drag handle, 3 snap points); `ResultRail` moves above the sheet; controls collapse.

## Order of execution

1. Design tokens + fonts + shadcn remap.
2. Layout shell + Mapbox 3D basemap + controls.
3. Markers + clustering + card/marker sync.
4. `CommandPanel` (chips, transcript, input, mood re-tint).
5. `ResultRail` + skeletons + empty/error.
6. `PlaceSheet` + `RouteLayer` animated line + distance/duration.
7. Motion pass, reduced-motion pass, a11y sweep.

## Not in scope (unless you ask)

- Backend changes / new server endpoints.
- Auth, favorites persistence beyond current localStorage.
- New icons/illustrations beyond Lucide.
- Copywriting beyond the placeholders in the spec.

Reply with **A/B** on the API question and **yes/no** on keeping the LLM conversation, or just say "go" to use the defaults (1A + LLM chat).

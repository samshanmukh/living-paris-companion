import type {
  IntentQuery,
  ParisFeature,
  ParisFeatureCollection,
  RouteLeg,
  RouteResponse,
  RouteWaypoint,
  SpatialQueryResult,
} from "./types";

// -----------------------------------------------------------------------------
// Client-side "Paris" — a curated in-memory POI set + Mapbox routing.
// No external API server required.
// -----------------------------------------------------------------------------

const MAPBOX_TOKEN =
  (import.meta.env.VITE_MAPBOX_TOKEN as string | undefined) ??
  (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined) ??
  (import.meta.env.NEXT_PUBLIC_MAPBOX_TOKEN as string | undefined);

const API_BASE =
  (import.meta.env.VITE_LIVING_PARIS_API as string | undefined) ??
  "https://living-paris-api.living-paris.workers.dev";


type POI = {
  id: string;
  name: string;
  lon: number;
  lat: number;
  layer: string;
  address?: string;
  arrondissement?: string;
  tags: string[];
  moods: string[];
  indoor?: boolean;
  romantic?: boolean;
  familyFriendly?: boolean;
  quiet?: boolean;
};

const POIS: POI[] = [
  { id: "ten-belles", name: "Ten Belles", lon: 2.3676, lat: 48.8721, layer: "cafes", address: "10 Rue de la Grange aux Belles", arrondissement: "10e", tags: ["coffee", "canal", "early"], moods: ["relaxing", "photography", "food", "general"], quiet: true },
  { id: "du-pain", name: "Du Pain et des Idées", lon: 2.3625, lat: 48.8710, layer: "cafes", address: "34 Rue Yves Toudic", arrondissement: "10e", tags: ["bakery", "pastry"], moods: ["food", "romantic", "general"] },
  { id: "shakespeare", name: "Shakespeare and Company", lon: 2.3474, lat: 48.8526, layer: "cafes", address: "37 Rue de la Bûcherie", arrondissement: "5e", tags: ["bookshop", "seine"], moods: ["culture", "rainy", "relaxing"], indoor: true, quiet: true },
  { id: "carnavalet", name: "Musée Carnavalet", lon: 2.3626, lat: 48.8577, layer: "museums", address: "23 Rue de Sévigné", arrondissement: "3e", tags: ["history", "marais"], moods: ["culture", "rainy", "family"], indoor: true },
  { id: "orangerie", name: "Musée de l'Orangerie", lon: 2.3226, lat: 48.8638, layer: "museums", address: "Jardin Tuileries", arrondissement: "1er", tags: ["monet", "waterlilies"], moods: ["culture", "rainy", "romantic"], indoor: true },
  { id: "buttes", name: "Parc des Buttes-Chaumont", lon: 2.3826, lat: 48.8799, layer: "parks", arrondissement: "19e", tags: ["hill", "view"], moods: ["relaxing", "family", "photography"], familyFriendly: true },
  { id: "luxembourg", name: "Jardin du Luxembourg", lon: 2.3372, lat: 48.8462, layer: "parks", arrondissement: "6e", tags: ["gardens", "chairs"], moods: ["relaxing", "family", "romantic"], familyFriendly: true },
  { id: "canal", name: "Canal Saint-Martin", lon: 2.3661, lat: 48.8703, layer: "parks", arrondissement: "10e", tags: ["towpath", "walk"], moods: ["romantic", "relaxing", "photography", "general"] },
  { id: "montmartre", name: "Butte Montmartre", lon: 2.3431, lat: 48.8867, layer: "parks", arrondissement: "18e", tags: ["view", "sunset"], moods: ["photography", "romantic"] },
  { id: "belleville", name: "Parc de Belleville", lon: 2.3849, lat: 48.8714, layer: "parks", arrondissement: "20e", tags: ["view", "sunset", "quiet"], moods: ["photography", "relaxing", "hidden"], quiet: true },
  { id: "fringe", name: "Fringe Coffee", lon: 2.3608, lat: 48.8598, layer: "cafes", address: "106 Rue de Turenne", arrondissement: "3e", tags: ["coffee", "marais"], moods: ["food", "relaxing", "general"] },
  { id: "chez-alain", name: "Chez Alain Miam Miam", lon: 2.3618, lat: 48.8637, layer: "cafes", address: "Marché des Enfants Rouges", arrondissement: "3e", tags: ["sandwich", "market"], moods: ["food", "family"] },
  { id: "as-du-fallafel", name: "L'As du Fallafel", lon: 2.3591, lat: 48.8570, layer: "cafes", address: "34 Rue des Rosiers", arrondissement: "4e", tags: ["falafel", "marais"], moods: ["food", "family"] },
  { id: "pont-neuf", name: "Pont Neuf", lon: 2.3413, lat: 48.8570, layer: "parks", arrondissement: "1er", tags: ["seine", "bridge"], moods: ["romantic", "photography"] },
  { id: "sainte-chapelle", name: "Sainte-Chapelle", lon: 2.3449, lat: 48.8554, layer: "museums", arrondissement: "1er", tags: ["stained-glass", "gothic"], moods: ["culture", "rainy", "romantic"], indoor: true },
  { id: "promenade", name: "Promenade Plantée", lon: 2.3823, lat: 48.8478, layer: "parks", arrondissement: "12e", tags: ["elevated", "quiet"], moods: ["relaxing", "hidden", "photography"], quiet: true },
];

const km = (a: [number, number], b: [number, number]) => {
  const R = 6371;
  const [lon1, lat1] = a;
  const [lon2, lat2] = b;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};

export async function spatialQuery(intent: IntentQuery): Promise<SpatialQueryResult> {
  // Try the live Living Paris API first.
  try {
    const r = await fetch(`${API_BASE}/api/spatial/query`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(intent),
    });
    if (r.ok) {
      const data = (await r.json()) as SpatialQueryResult & { error?: string };
      if (!data.error && data.geojson?.features?.length) return data;
    }
  } catch {
    // network failure → fall back to local POIs
  }

  const center: [number, number] = [intent.lon ?? 2.3522, intent.lat ?? 48.8566];
  const mood = intent.mood ?? "general";
  const walkKm = Math.max(1, Math.min(8, (intent.walk ?? 15) / 12)); // ~12 min/km walking

  let picks = POIS.filter((p) => p.moods.includes(mood) || mood === "general");

  if (intent.indoor) picks = picks.filter((p) => p.indoor);
  if (picks.length < 3) picks = POIS.slice();

  picks = picks
    .map((p) => ({ p, d: km(center, [p.lon, p.lat]) }))
    .filter((x) => x.d <= walkKm * 1.4)
    .sort((a, b) => a.d - b.d)
    .slice(0, intent.limit ?? 8)
    .map((x) => x.p);

  if (picks.length === 0) picks = POIS.slice(0, 6);

  const features: ParisFeature[] = picks.map((p) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: [p.lon, p.lat] },
    properties: {
      id: p.id,
      name: p.name,
      layer: p.layer,
      address: p.address,
      arrondissement: p.arrondissement,
      tags: p.tags,
      indoor: p.indoor,
      quiet: p.quiet,
      familyFriendly: p.familyFriendly,
    },
  }));

  const geojson: ParisFeatureCollection = { type: "FeatureCollection", features };
  const newCenter: [number, number] = features.length
    ? [
        features.reduce((s, f) => s + (f.geometry.coordinates[0] as number), 0) / features.length,
        features.reduce((s, f) => s + (f.geometry.coordinates[1] as number), 0) / features.length,
      ]
    : center;

  // Simulate a small network delay so the UI's thinking state feels natural.
  await new Promise((r) => setTimeout(r, 320));

  return {
    intent,
    layers: [],
    totalFeatures: features.length,
    geojson,
    meta: { radiusMeters: walkKm * 1000, center: newCenter, queryMs: 320 },
  };
}

function mapboxLegs(
  waypoints: RouteWaypoint[],
  legs: { distance: number; duration: number }[],
): RouteLeg[] {
  return legs.map((leg, i) => ({
    from: waypoints[i],
    to: waypoints[i + 1],
    distanceMeters: leg.distance,
    durationMinutes: leg.duration / 60,
  }));
}

export async function planRoute(waypoints: RouteWaypoint[]): Promise<RouteResponse> {
  if (waypoints.length < 2) throw new Error("Need at least two waypoints");

  if (!MAPBOX_TOKEN) {
    throw new Error("Mapbox token missing — add VITE_MAPBOX_TOKEN to .env");
  }

  // Try the Living Paris API routes endpoint first.
  try {
    const r = await fetch(`${API_BASE}/api/routes`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ waypoints, profile: "walking" }),
    });
    if (r.ok) {
      const data = (await r.json()) as RouteResponse & { error?: string };
      if (!data.error && data.geometry) return data;
    }
  } catch {
    // fall through to direct Mapbox
  }

  const coords = waypoints.map((w) => `${w.lon},${w.lat}`).join(";");
  const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${coords}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;


  try {
    const r = await fetch(url);
    if (r.ok) {
      const data = await r.json();
      const route = data.routes?.[0];
      if (route) {
        return {
          profile: "walking",
          provider: "mapbox",
          geometry: {
            type: "Feature",
            geometry: route.geometry,
            properties: {},
          },
          distanceMeters: route.distance,
          durationMinutes: route.duration / 60,
          legs: mapboxLegs(waypoints, route.legs ?? []),
          cameraPath: route.geometry.coordinates,
          accessible: true,
        };
      }
    }
  } catch {
    // fall through to straight-line fallback
  }

  // Fallback: straight line between waypoints, walking at ~5 km/h
  const line = waypoints.map((w) => [w.lon, w.lat] as [number, number]);
  let distM = 0;
  for (let i = 1; i < line.length; i++) distM += km(line[i - 1], line[i]) * 1000;
  return {
    profile: "walking",
    provider: "fallback-line",
    geometry: {
      type: "Feature",
      geometry: { type: "LineString", coordinates: line },
      properties: {},
    },
    distanceMeters: distM,
    durationMinutes: distM / 1000 / 5 * 60,
    legs: [],
    cameraPath: line,
    accessible: true,
  };
}

export function parseIntent(text: string): IntentQuery {
  const t = text.toLowerCase();
  const intent: IntentQuery = { lat: 48.8566, lon: 2.3522, walk: 15 };
  if (/roman|date|evening/.test(t)) intent.mood = "romantic";
  else if (/kid|family|child/.test(t)) intent.mood = "family";
  else if (/rain/.test(t)) {
    intent.mood = "rainy";
    intent.indoor = true;
  } else if (/photo/.test(t)) intent.mood = "photography";
  else if (/quiet|calm|relax|slow/.test(t)) intent.mood = "relaxing";
  else if (/museum|art|cultur/.test(t)) intent.mood = "culture";
  else if (/eat|food|restaurant|caf|coffee|bakery|delicious/.test(t)) intent.mood = "food";
  else if (/hidden|secret/.test(t)) intent.mood = "hidden";
  else intent.mood = "general";
  const b = t.match(/(\d+)\s*(?:€|eur|euro)/);
  if (b) intent.budget = Number(b[1]);
  if (/wheelchair|accessible/.test(t)) intent.accessibility = true;
  return intent;
}

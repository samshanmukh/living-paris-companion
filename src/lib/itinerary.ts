// Build a multi-stop itinerary from top POIs. Naive nearest-neighbour ordering.
import type { ParisFeature } from "./types";

export interface Itinerary {
  id: string;
  title: string;
  vibe: string;
  stops: ParisFeature[];
  minutes: number;
  km: number;
}

const km = (a: [number, number], b: [number, number]) => {
  const [x1, y1] = a; const [x2, y2] = b;
  const R = 6371, toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(y2 - y1), dLon = toRad(x2 - x1);
  const s = Math.sin(dLat/2) ** 2 + Math.cos(toRad(y1)) * Math.cos(toRad(y2)) * Math.sin(dLon/2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};

function orderNN(features: ParisFeature[], start: [number, number]): ParisFeature[] {
  const remaining = [...features];
  const ordered: ParisFeature[] = [];
  let cur = start;
  while (remaining.length) {
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const c = remaining[i].geometry.coordinates as [number, number];
      const d = km(cur, c);
      if (d < bestD) { bestD = d; best = i; }
    }
    const pick = remaining.splice(best, 1)[0];
    ordered.push(pick);
    cur = pick.geometry.coordinates as [number, number];
  }
  return ordered;
}

function totals(stops: ParisFeature[], start: [number, number]) {
  let total = 0;
  let cur = start;
  for (const s of stops) {
    const c = s.geometry.coordinates as [number, number];
    total += km(cur, c);
    cur = c;
  }
  // 4.5 km/h walking + 25 min at each stop
  const minutes = Math.round((total / 4.5) * 60 + stops.length * 25);
  return { km: Math.round(total * 10) / 10, minutes };
}

export function buildItineraries(features: ParisFeature[], start: [number, number]): Itinerary[] {
  if (features.length < 2) return [];
  const top = features.slice(0, 4);
  const ordered = orderNN(top, start);
  const t = totals(ordered, start);

  // Variant 2: reverse (long tour → focused tour)
  const focused = ordered.slice(0, 3);
  const tf = totals(focused, start);

  // Variant 3: café-first vs museum-first (reorder if any category present)
  const cafe = ordered.find((f) => /caf|coffee|food/i.test(f.properties.layer));
  const rest = ordered.filter((f) => f !== cafe);
  const cafeFirst = cafe ? [cafe, ...rest] : ordered;
  const tc = totals(cafeFirst, start);

  return [
    { id: "full",    title: "The full arc",     vibe: "One long, cinematic loop through every stop.", stops: ordered,   ...t },
    { id: "focused", title: "Focused three",    vibe: "Fewer stops, more time to linger.",             stops: focused,   ...tf },
    { id: "cafe",    title: "Café first",       vibe: "Warm start, then the neighbourhood unfolds.",   stops: cafeFirst, ...tc },
  ];
}

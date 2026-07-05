import { isRainFriendly } from "@/lib/rainMode";
import type { MoodType, ParisFeature } from "./types";

export interface Itinerary {
  id: string;
  title: string;
  vibe: string;
  tag?: string;
  stops: ParisFeature[];
  minutes: number;
  km: number;
}

const km = (a: [number, number], b: [number, number]) => {
  const [x1, y1] = a;
  const [x2, y2] = b;
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(y2 - y1);
  const dLon = toRad(x2 - x1);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(y1)) * Math.cos(toRad(y2)) * Math.sin(dLon / 2) ** 2;
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
      if (d < bestD) {
        bestD = d;
        best = i;
      }
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
  const minutes = Math.round((total / 4.5) * 60 + stops.length * 25);
  return { km: Math.round(total * 10) / 10, minutes };
}

export function formatPlanDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} MIN`;
  if (m === 0) return `${h}H`;
  return `${h}H${String(m).padStart(2, "0")}`;
}

export function planDayEyebrow(): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: "Europe/Paris",
  })
    .format(new Date())
    .toUpperCase();
}

export function stopDescription(feature: ParisFeature): string {
  const name = feature.properties.name;
  const layer = feature.properties.layer ?? "";
  const lower = name.toLowerCase();

  if (/fallafel|falafel/.test(lower)) return "Falafel before the queue forms";
  if (/shakespeare/.test(lower)) return "Browse the stacks, stay dry inside";
  if (/carnavalet/.test(lower)) return "Empty cloisters, history close up";
  if (/orangerie/.test(lower)) return "Water lilies in soft light";
  if (/sainte-chapelle|chapelle/.test(lower)) return "Stained glass, hushed air";
  if (/fringe/.test(lower)) return "Coffee at the counter, Fringe";
  if (/ten belles/.test(lower)) return "Canal-side coffee, slow start";
  if (/du pain/.test(lower)) return "Pastry first, always";
  if (/chez alain|miam/.test(lower)) return "Market counter, no fuss";
  if (/luxembourg/.test(lower)) return "Chairs in the sun, if it holds";
  if (/buttes/.test(lower)) return "Hill views, wide sky";
  if (/canal saint-martin|canal/.test(lower)) return "Towpath wander, bridges overhead";
  if (/montmartre/.test(lower)) return "Steps and skyline";
  if (/promenade plantée|promenade/.test(lower)) return "Elevated walk, city below";
  if (/museum|musée/.test(layer)) return `Quiet galleries, ${name.split(" ").slice(-1)[0]}`;
  if (/caf|coffee|food/i.test(layer)) return `Warm stop, ${name}`;
  if (/park/i.test(layer)) return `Open air pause, ${name}`;
  return name;
}

const MOOD_TITLES: Partial<Record<MoodType, [string, string]>> = {
  romantic: ["Golden Hour Along the Seine", "Intimate Corners, Soft Light"],
  rainy: ["Sheltered Loop, Dry Start", "Covered Passages Only"],
  food: ["A Marais Morning, Before It Wakes", "Taste the Neighbourhood"],
  culture: ["Museum Hush, Old Stones", "Culture at an Easy Pace"],
  relaxing: ["Slow Streets, Long Pauses", "Three Stops, No Rush"],
  family: ["Little Legs, Big Discoveries", "Parks and Pastries"],
  photography: ["Light Chasing, Quiet Angles", "Frames Worth the Walk"],
  hidden: ["Side Streets the Guidebooks Miss", "Locals' Short Loop"],
  general: ["A Marais Morning, Before It Wakes", "The Full Arc"],
};

export function buildItineraries(
  features: ParisFeature[],
  start: [number, number],
  opts?: { mood?: MoodType; rainMode?: boolean },
): Itinerary[] {
  if (features.length < 2) return [];

  const mood = opts?.mood ?? "general";
  const titles = MOOD_TITLES[mood] ?? MOOD_TITLES.general!;
  const top = features.slice(0, 4);
  const ordered = orderNN(top, start);
  const focused = ordered.slice(0, 3);
  const cafe = ordered.find((f) => /caf|coffee|food/i.test(f.properties.layer));
  const cafeFirst = cafe ? [cafe, ...ordered.filter((f) => f !== cafe)] : ordered;

  const plans: Itinerary[] = [
    {
      id: "primary",
      title: titles[0],
      vibe: "One long, cinematic loop through every stop.",
      stops: ordered,
      ...totals(ordered, start),
    },
    {
      id: "focused",
      title: titles[1],
      vibe: "Fewer stops, more time to linger.",
      stops: focused,
      ...totals(focused, start),
    },
  ];

  if (cafe && cafeFirst[0] === cafe) {
    plans.push({
      id: "cafe-first",
      title: "Café First, Then the City Opens",
      vibe: "Warm start, then the neighbourhood unfolds.",
      stops: cafeFirst.slice(0, 3),
      ...totals(cafeFirst.slice(0, 3), start),
    });
  }

  const rainStops = orderNN(
    features.filter(isRainFriendly).slice(0, 3),
    start,
  );
  if ((opts?.rainMode || mood === "rainy") && rainStops.length >= 2) {
    plans.push({
      id: "rain",
      title: "Left Bank Sheltered Loop",
      tag: "RAINY OPTION",
      vibe: "Covered passages and indoor warmth.",
      stops: rainStops,
      ...totals(rainStops, start),
    });
  }

  const seen = new Set<string>();
  return plans.filter((p) => {
    const key = p.stops.map((s) => s.properties.id).join("-");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 3);
}

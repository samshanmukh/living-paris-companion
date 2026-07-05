import { isRainFriendly } from "@/lib/rainMode";
import type { IntentQuery, ParisFeature } from "@/lib/types";

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

function moodScore(feature: ParisFeature, mood: IntentQuery["mood"]): number {
  const layer = feature.properties.layer ?? "";
  const tags = (feature.properties.tags ?? []).join(" ");
  const blob = `${layer} ${tags} ${feature.properties.name}`.toLowerCase();
  const m = mood ?? "general";
  if (m === "rainy" && isRainFriendly(feature)) return 3;
  if (m === "food" && /caf|food|coffee|restaurant|bakery/.test(blob)) return 3;
  if (m === "culture" && /museum|culture|art|chapelle/.test(blob)) return 3;
  if (m === "relaxing" && (feature.properties.quiet || /park|garden|canal/.test(blob))) return 3;
  if (m === "romantic" && /seine|bridge|garden|canal/.test(blob)) return 2;
  if (m === "family" && feature.properties.familyFriendly) return 3;
  if (m === "photography" && /view|montmartre|belleville|canal/.test(blob)) return 2;
  if (m === "hidden" && feature.properties.quiet) return 2;
  return 1;
}

function orderNearest(features: ParisFeature[], start: [number, number]): ParisFeature[] {
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

/** Rank, filter, and order places to match the guest's latest intent. */
export function refinePlacesForIntent(
  features: ParisFeature[],
  intent: IntentQuery,
  opts: { rainMode: boolean; accessibleMode: boolean; center: [number, number] },
): ParisFeature[] {
  if (!features.length) return [];

  let list = [...features];
  const wantsCover = opts.rainMode || intent.indoor || intent.mood === "rainy";

  if (wantsCover) {
    const covered = list.filter(isRainFriendly);
    if (covered.length >= 2) list = covered;
    else if (covered.length === 1) {
      list = [covered[0], ...list.filter((f) => f.properties.id !== covered[0].properties.id)];
    }
  }

  if (opts.accessibleMode || intent.accessibility) {
    const stepFree = list.filter((f) => f.properties.accessible !== false);
    if (stepFree.length >= 2) list = stepFree;
  }

  const start = [intent.lon ?? opts.center[0], intent.lat ?? opts.center[1]] as [number, number];
  const limit = Math.min(intent.limit ?? 4, 4);

  list = list
    .map((f) => ({
      f,
      score: moodScore(f, intent.mood) - km(start, f.geometry.coordinates as [number, number]) * 0.15,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(limit, 2))
    .map((x) => x.f);

  return orderNearest(list, start).slice(0, limit);
}

export function planTitle(mood: IntentQuery["mood"], rainMode: boolean): string {
  if (rainMode || mood === "rainy") return "Rain-ready walk";
  if (mood === "romantic") return "Romantic loop";
  if (mood === "food") return "Taste of Paris";
  if (mood === "culture") return "Culture crawl";
  if (mood === "relaxing") return "Slow Paris";
  if (mood === "family") return "Family afternoon";
  if (mood === "photography") return "Golden-hour route";
  if (mood === "hidden") return "Hidden corners";
  return "Your Paris plan";
}

import type { ParisFeature } from "./types";

// Rain-aware score: covered/indoor spots boost, exposed parks fade.
export function isRainFriendly(f: ParisFeature): boolean {
  const layer = f.properties.layer ?? "";
  const name = (f.properties.name ?? "").toLowerCase();
  if (/museum|caf|coffee|food|restaurant/i.test(layer)) return true;
  if (/passage|arcade|hall|shakespeare|orangerie|chapelle|carnavalet/.test(name)) return true;
  return false;
}

export function rainDim(f: ParisFeature): number {
  // 1 = full, 0.2 = dimmed
  return isRainFriendly(f) ? 1 : 0.28;
}

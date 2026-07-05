import type { MoodType, ParisFeature } from "./types";

/** Poetic / contextual map labels — mockup style ("Cellar jazz · 22h"). */
export function markerLabel(
  feature: ParisFeature,
  mood: MoodType,
  index: number,
): { title: string; subtitle: string | null } {
  const p = feature.properties;
  const tags = p.tags ?? [];

  if (mood === "nightlife") {
    const night = ["Cellar jazz · 22h", "The unmarked door", "Your bridge", "Last call bar"];
    if (index < night.length) return { title: night[index], subtitle: p.name };
    if (tags.includes("bar") || tags.includes("wine")) return { title: "The unmarked door", subtitle: p.name };
    return { title: p.name, subtitle: "After midnight" };
  }

  if (mood === "relaxing") {
    const morning = ["First-light café", "The quiet towpath", "Before the city wakes"];
    if (index < morning.length) return { title: morning[index], subtitle: p.name };
    if (tags.includes("coffee")) return { title: "Serious coffee", subtitle: p.name };
    if (tags.includes("canal") || tags.includes("towpath")) return { title: "The quiet towpath", subtitle: p.name };
    return { title: p.name, subtitle: "Slow morning" };
  }

  if (mood === "food") {
    if (tags.includes("bakery")) return { title: "Still-warm pastry", subtitle: p.name };
    if (tags.includes("falafel") || tags.includes("sandwich")) return { title: "Somewhere delicious", subtitle: p.name };
    return { title: p.name, subtitle: "Worth the detour" };
  }

  if (mood === "romantic") {
    if (tags.includes("sunset") || tags.includes("view")) return { title: "Golden hour here", subtitle: p.name };
    if (tags.includes("seine") || tags.includes("bridge")) return { title: "Your bridge", subtitle: p.name };
    return { title: p.name, subtitle: "Date-friendly" };
  }

  if (mood === "rainy") {
    if (p.indoor) return { title: "Dry inside", subtitle: p.name };
    if (tags.includes("passage") || tags.includes("covered")) return { title: "Covered walk", subtitle: p.name };
    return { title: p.name, subtitle: "Rain-safe" };
  }

  if (p.quiet) return { title: p.name, subtitle: "Quiet" };
  if (tags.includes("view")) return { title: p.name, subtitle: "★ View" };
  if (tags.includes("coffee")) return { title: p.name, subtitle: "Top rated" };

  const ordinals = ["Start here", "Then here", "End here", "One more"];
  return { title: ordinals[index] ?? p.name, subtitle: index === 0 ? p.name : null };
}

export function routeStopNumber(index: number): number {
  return index + 1;
}

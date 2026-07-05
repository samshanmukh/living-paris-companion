import type { LightPreset } from "@/lib/parisWeather";

/** Time-aware host line for the arrival overlay — synced to map fly-in end. */
export function arrivalHostLine(hour: number, preset: LightPreset): string {
  if (preset === "night" || hour >= 22 || hour < 5) {
    return "Paris after dark — tell me what you're looking for.";
  }
  if (preset === "dawn" || (hour >= 5 && hour < 8)) {
    return "Early light on the river — where shall we begin?";
  }
  if (preset === "dusk" || (hour >= 18 && hour < 21)) {
    return "Golden hour is creeping in — what's the mood tonight?";
  }
  if (hour >= 11 && hour < 14) {
    return "Lunch hour in Paris — hungry, or just wandering?";
  }
  if (hour >= 8 && hour < 11) {
    return "A quiet morning waits — tell me the day you want.";
  }
  return "Bienvenue — I'll draw the map around you.";
}

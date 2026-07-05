import type { LightPreset } from "@/lib/parisWeather";
import type { MoodType } from "@/lib/types";

/** Default chat mood from live Paris hour — map lighting already follows conditions. */
export function moodFromParisHour(hour: number, preset: LightPreset): MoodType {
  if (preset === "night" || hour >= 22 || hour < 5) return "nightlife";
  if (preset === "dawn" || (hour >= 5 && hour < 10)) return "relaxing";
  if (preset === "dusk" || (hour >= 18 && hour < 21)) return "romantic";
  if (hour >= 11 && hour < 15) return "food";
  if (hour >= 15 && hour < 18) return "culture";
  return "general";
}

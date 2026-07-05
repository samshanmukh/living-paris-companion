import type { MoodType } from "./types";

export type Suggestion = {
  label: string;
  prompt: string;
  mood?: MoodType;
  action?: "start-route";
  /** Subtle map relight when tapped (Paris hour 0–23). */
  hour?: number;
  walk?: number;
  budget?: number;
  indoor?: boolean;
  /** Brief label for the “what changed” chip on map. */
  mapHint?: string;
};

/** Default chips shown before the first message — matches product mockups. */
export const DEFAULT_SUGGESTIONS: Suggestion[] = [
  { label: "A quiet morning", prompt: "Plan a quiet morning in Paris — slow café, towpath walk, no crowds before 10am.", mood: "relaxing" },
  { label: "Somewhere delicious", prompt: "Somewhere delicious for lunch — serious food, walkable, under €25.", mood: "food" },
  { label: "Paris after midnight", prompt: "Paris after midnight — jazz, a bar with no sign, and a bridge we'll have to ourselves.", mood: "nightlife" },
];

export function starterSuggestions(hasLocation: boolean): Suggestion[] {
  if (hasLocation) return DEFAULT_SUGGESTIONS;
  return [
    { label: "Use my location", prompt: "Use my location" },
    ...DEFAULT_SUGGESTIONS,
  ];
}

/** Contextual follow-ups after the assistant replies. */
export function suggestionsForMood(mood: MoodType): Suggestion[] {
  switch (mood) {
    case "relaxing":
      return [
        { label: "Add a bakery stop", prompt: "Add a great bakery stop to this route.", mood: "food" },
        { label: "Keep it rain-safe", prompt: "Make this plan work if it starts raining.", mood: "rainy" },
        { label: "Live this one", prompt: "Live this one", action: "start-route", mood: "relaxing" },
      ];
    case "food":
      return [
        { label: "Wine after dinner", prompt: "Add a natural-wine bar after dinner.", mood: "nightlife" },
        { label: "Family-friendly", prompt: "Make this family-friendly instead.", mood: "family" },
        { label: "Live this one", prompt: "Live this one", action: "start-route", mood: "food" },
      ];
    case "nightlife":
      return [
        { label: "Safer walk home", prompt: "Route me home along well-lit streets after midnight.", mood: "nightlife" },
        { label: "Quieter option", prompt: "Something quieter — less of a scene.", mood: "relaxing" },
        { label: "Live this one", prompt: "Live this one", action: "start-route", mood: "nightlife" },
      ];
    case "rainy":
      return [
        { label: "Indoor only", prompt: "Indoor-only version of this plan.", mood: "rainy" },
        { label: "Covered passages", prompt: "Route through covered passages only.", mood: "rainy" },
        { label: "Live this one", prompt: "Live this one", action: "start-route", mood: "rainy" },
      ];
    case "romantic":
      return [
        { label: "Sunset timing", prompt: "Time this for golden hour on the Seine.", mood: "photography" },
        { label: "Candlelit dinner", prompt: "Add a candlelit bistro.", mood: "food" },
        { label: "Live this one", prompt: "Live this one", action: "start-route", mood: "romantic" },
      ];
    default:
      return DEFAULT_SUGGESTIONS;
  }
}

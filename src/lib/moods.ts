import type { MoodType } from "./types";
import { moodMapStyleVars } from "./moodMap";

export interface MoodTheme {
  solid: string;
  text: string;
  tint: string;
  line: string;
}

// Muted earthy accents — one accent active at a time.
// Applied to marker dot, route line, active chip, and tag pills only.
// Structural UI stays cream + ink.
export const MOOD_THEMES: Record<MoodType, MoodTheme> = {
  romantic:    { solid: "#C77E6A", text: "#8B4E3B", tint: "rgba(199,126,106,0.14)", line: "Which arrondissement should we start in tonight?" },
  family:      { solid: "#7E9B6E", text: "#4E6A44", tint: "rgba(126,155,110,0.14)", line: "Somewhere little hands can wander." },
  rainy:       { solid: "#7C93A6", text: "#4B6273", tint: "rgba(124,147,166,0.14)", line: "I know a covered passage for weather like this." },
  photography: { solid: "#C79A4E", text: "#8B6A2E", tint: "rgba(199,154,78,0.14)",  line: "Golden hour is closer than you think." },
  culture:     { solid: "#8B7355", text: "#5E4D38", tint: "rgba(139,115,85,0.14)",  line: "Every wall in this city is a book." },
  food:        { solid: "#C77E6A", text: "#8B4E3B", tint: "rgba(199,126,106,0.14)", line: "Follow the smell of butter — always." },
  relaxing:    { solid: "#6E9B95", text: "#41625E", tint: "rgba(110,155,149,0.14)", line: "Slow streets, warm cups, longer afternoons." },
  nightlife:   { solid: "#8B7355", text: "#5E4D38", tint: "rgba(139,115,85,0.14)",  line: "After midnight the city changes hands." },
  hidden:      { solid: "#7E9B6E", text: "#4E6A44", tint: "rgba(126,155,110,0.14)", line: "The best doors don't announce themselves." },
  general:     { solid: "#C77E6A", text: "#8B4E3B", tint: "rgba(199,126,106,0.12)", line: "Tell me the day you want — I'll draw the map." },
};

export function moodStyleVars(mood: MoodType): React.CSSProperties {
  const t = MOOD_THEMES[mood] ?? MOOD_THEMES.general;
  return {
    ["--accent" as string]: t.solid,
    ["--accent-text" as string]: t.text,
    ["--accent-tint" as string]: t.tint,
    ...moodMapStyleVars(mood),
  };
}

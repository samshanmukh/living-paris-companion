import type { MoodType, ParisFeature } from "./types";
import { MOOD_THEMES } from "./moods";

const MOOD_QUESTIONS: Partial<Record<MoodType, string>> = {
  romantic: "Should I soften the pace — linger longer anywhere, or add a wine bar?",
  rainy: "Want me to swap anything that's too exposed? I know covered paths nearby.",
  food: "Any dietary notes before we walk? I'll adjust stops on the fly.",
  family: "Anyone need a bathroom or bench break built in?",
  relaxing: "Prefer fewer stops and more time sitting, or keep moving gently?",
  photography: "Want golden-hour timing on any stop, or is this order good?",
  culture: "Museum depth or lighter pass-by — what feels right today?",
  hidden: "Should I tuck in one more secret spot, or keep it tight?",
  nightlife: "Starting early or building toward a late stop?",
};

export function livingFollowUp(stops: ParisFeature[], mood: MoodType, guestName?: string | null): string {
  const names = stops.slice(0, 3).map((s) => s.properties.name).filter(Boolean);
  const trail = names.length ? names.join(" → ") : "your picks";
  const greet = guestName?.trim() ? `${guestName.trim()}, ` : "";
  const moodQ = MOOD_QUESTIONS[mood];
  const opener = `${greet}we're living this one — ${trail}.`;

  if (moodQ) return `${opener} ${moodQ}`;
  return `${opener} Tell me what to tweak — pace, vibe, or swap a stop.`;
}

export function livingWelcomeLine(mood: MoodType): string {
  return MOOD_THEMES[mood]?.line ?? MOOD_THEMES.general.line;
}

import { useSceneStore } from "@/store/useSceneStore";
import { useTraitsStore } from "@/store/useTraitsStore";
import { useCityStore } from "@/store/useCityStore";
import type { Suggestion } from "@/lib/suggestions";

/** Apply subtle map + intent shifts before sending the chip prompt. */
export function applySuggestionEffects(chip: Suggestion) {
  const hints: string[] = [];

  if (chip.hour != null) {
    useSceneStore.getState().setHour(chip.hour);
    hints.push(chip.mapHint ?? `Time · ${formatHour(chip.hour)}`);
  }

  if (chip.walk != null) {
    useTraitsStore.getState().ingest("", { walk: chip.walk });
    hints.push(chip.mapHint ?? `${chip.walk} min walk`);
  }

  if (chip.budget != null) {
    useTraitsStore.getState().ingest("", { budget: chip.budget });
    hints.push(chip.mapHint ?? `~€${chip.budget}`);
  }

  if (chip.indoor != null) {
    useTraitsStore.getState().ingest("", { indoor: chip.indoor });
    if (chip.indoor) hints.push(chip.mapHint ?? "Indoor-first");
  }

  if (chip.mood && chip.mood !== useCityStore.getState().mood) {
    useCityStore.getState().setMoodFromAction(chip.mood);
    hints.push(chip.mapHint ?? `Mood · ${chip.mood}`);
  } else if (chip.mapHint && hints.length === 0) {
    hints.push(chip.mapHint);
  }

  if (hints.length) {
    useCityStore.getState().setConversationHints(hints.slice(0, 2));
  }
}

function formatHour(h: number): string {
  const hour = ((h % 24) + 24) % 24;
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}

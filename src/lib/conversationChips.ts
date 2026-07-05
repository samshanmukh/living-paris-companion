import type { ChatMessage } from "@/store/useCityStore";
import type { Suggestion } from "@/lib/suggestions";
import { suggestionsForMood, starterSuggestions } from "@/lib/suggestions";
import type { MoodType } from "@/lib/types";

function recentContext(messages: ChatMessage[], take = 5): string {
  return messages
    .slice(-take)
    .map((m) => m.text)
    .join(" ")
    .toLowerCase();
}

function morningTimeChips(): Suggestion[] {
  return [
    { label: "8 AM", prompt: "8 AM — early and quiet.", hour: 8, mapHint: "Dawn light · 8 AM" },
    { label: "9 AM", prompt: "9 AM — unhurried start.", hour: 9, mapHint: "Soft morning · 9 AM" },
    { label: "10 AM", prompt: "10 AM — still before the rush.", hour: 10, mapHint: "Late morning · 10 AM" },
  ];
}

function eveningTimeChips(): Suggestion[] {
  return [
    { label: "5 PM", prompt: "5 PM — golden hour.", hour: 17, mapHint: "Golden hour · 5 PM" },
    { label: "7 PM", prompt: "7 PM — early evening.", hour: 19, mapHint: "Early evening · 7 PM" },
    { label: "9 PM", prompt: "9 PM — after dark.", hour: 21, mapHint: "Night lights · 9 PM" },
  ];
}

function paceChips(): Suggestion[] {
  return [
    { label: "Slow & lingering", prompt: "Keep it slow — linger at each stop.", walk: 35, mood: "relaxing", mapHint: "Slow pace" },
    { label: "Balanced", prompt: "A balanced pace — not rushed.", walk: 20, mapHint: "Balanced pace" },
    { label: "Efficient", prompt: "Tighter loop — keep us moving.", walk: 12, mapHint: "Brisk pace" },
  ];
}

function companionChips(): Suggestion[] {
  return [
    { label: "Just me", prompt: "Just me — solo wander.", mapHint: "Solo wander" },
    { label: "With a partner", prompt: "With my partner — intimate and unhurried.", mood: "romantic", mapHint: "For two" },
    { label: "With family", prompt: "With family — easy stops and space.", mood: "family", mapHint: "Family pace" },
  ];
}

function dietaryChips(): Suggestion[] {
  return [
    { label: "No restrictions", prompt: "No dietary restrictions — surprise me.", mapHint: "Open menu" },
    { label: "Vegetarian", prompt: "Vegetarian-friendly only.", mapHint: "Vegetarian" },
    { label: "Halal", prompt: "Halal options please.", mapHint: "Halal-friendly" },
  ];
}

function budgetChips(): Suggestion[] {
  return [
    { label: "Under €15", prompt: "Keep it under €15 per stop.", budget: 15, mapHint: "Budget · €15" },
    { label: "Around €25", prompt: "Around €25 — treat but not fussy.", budget: 25, mapHint: "Mid spend · €25" },
    { label: "Splurge a little", prompt: "Splurge a little — worth it today.", budget: 45, mapHint: "Splurge mode" },
  ];
}

function yesNoChips(): Suggestion[] {
  return [
    { label: "Yes, please", prompt: "Yes — that sounds perfect.", mapHint: "Noted" },
    { label: "Something else", prompt: "Something else — show me another angle.", mapHint: "New angle" },
    { label: "Keep it simple", prompt: "Keep it simple — fewer stops.", walk: 15, mapHint: "Simpler plan" },
  ];
}

/** Infer tap-to-answer chips from the concierge's latest question. */
export function inferConversationChips(opts: {
  lastAiText: string;
  messages: ChatMessage[];
  mood: MoodType;
}): Suggestion[] | null {
  const ai = opts.lastAiText.toLowerCase();
  const ctx = recentContext(opts.messages);

  if (!/\?/.test(opts.lastAiText)) return null;

  if (/what time|when would you|what hour|when to start|start time|what time would/i.test(ai)) {
    if (/evening|night|dinner|sunset|late|midnight|after dark/.test(ctx + ai)) {
      return eveningTimeChips();
    }
    if (/morning|quiet|slow|caf|breakfast|early|sunrise|before 10|before ten/.test(ctx + ai)) {
      return morningTimeChips();
    }
    return morningTimeChips();
  }

  if (/how (fast|slow)|what pace|lingering|walk.*pace|too rushed|rush/i.test(ai)) {
    return paceChips();
  }

  if (/who are you with|alone|partner|family|companion|who('s| is) joining/i.test(ai)) {
    return companionChips();
  }

  if (/diet|halal|vegetarian|vegan|allerg|eat anything|food restriction/i.test(ai)) {
    return dietaryChips();
  }

  if (/budget|spend|afford|€|euro|price/i.test(ai)) {
    return budgetChips();
  }

  if (/would you like|want me to|shall i|should i|prefer/i.test(ai)) {
    return yesNoChips();
  }

  return null;
}

export function parseModelChips(raw: unknown): Suggestion[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item): Suggestion | null => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      const label = typeof o.label === "string" ? o.label.trim() : "";
      const prompt = typeof o.prompt === "string" ? o.prompt.trim() : label;
      if (!label) return null;
      return {
        label,
        prompt,
        mood: typeof o.mood === "string" ? (o.mood as MoodType) : undefined,
        action: o.action === "start-route" ? "start-route" : undefined,
        hour: typeof o.hour === "number" ? o.hour : undefined,
        walk: typeof o.walk === "number" ? o.walk : undefined,
        budget: typeof o.budget === "number" ? o.budget : undefined,
        indoor: typeof o.indoor === "boolean" ? o.indoor : undefined,
        mapHint: typeof o.mapHint === "string" ? o.mapHint : undefined,
      };
    })
    .filter((c): c is Suggestion => c !== null)
    .slice(0, 4);
}

export function resolveConversationChips(opts: {
  modelChips?: Suggestion[];
  lastAiText: string;
  messages: ChatMessage[];
  mood: MoodType;
  hasPlan: boolean;
  hasLocation: boolean;
  hasSent: boolean;
}): Suggestion[] {
  const inferred = inferConversationChips({
    lastAiText: opts.lastAiText,
    messages: opts.messages,
    mood: opts.mood,
  });

  let chips =
    opts.modelChips && opts.modelChips.length > 0
      ? opts.modelChips
      : inferred ??
        (opts.hasSent ? suggestionsForMood(opts.mood) : starterSuggestions(opts.hasLocation));

  if (opts.hasPlan && !chips.some((c) => c.action === "start-route")) {
    chips = [
      ...chips.slice(0, 3),
      { label: "Live this one", prompt: "Live this one", action: "start-route", mood: opts.mood },
    ];
  }

  return chips.slice(0, 4);
}

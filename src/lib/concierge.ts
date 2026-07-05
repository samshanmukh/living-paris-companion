import type {
  GuestProfile,
  IntentQuery,
  MapAction,
  MoodType,
  ParisFeature,
  ParisFeatureCollection,
} from "./types";
import { parseModelChips } from "@/lib/conversationChips";
import type { Suggestion } from "@/lib/suggestions";

export function mergeProfile(prev: GuestProfile, incoming?: Partial<GuestProfile> | null): GuestProfile {
  if (!incoming) return prev;
  const next = { ...prev };
  for (const [k, v] of Object.entries(incoming) as [keyof GuestProfile, GuestProfile[keyof GuestProfile]][]) {
    if (v != null && v !== "") (next as Record<string, unknown>)[k] = v;
  }
  return next;
}

export function mergeQuery(
  accumulated: Partial<IntentQuery>,
  incoming?: Partial<IntentQuery> | null,
  profile?: GuestProfile,
): IntentQuery {
  const base: IntentQuery = {
    lat: 48.8566,
    lon: 2.3522,
    walk: 15,
    mood: "general",
    ...accumulated,
    ...(incoming ?? {}),
  };

  if (profile?.dietary && !base.dietary?.length) {
    base.dietary = [profile.dietary];
  }
  if (profile?.accessibility && base.accessibility == null) {
    base.accessibility = /step|wheel|mobil|access/i.test(profile.accessibility);
  }
  if (profile?.budget && base.budget == null) {
    const m = profile.budget.match(/(\d+)/);
    if (m) base.budget = Number(m[1]);
  }
  if (profile?.onTheirMind && !incoming?.mood) {
    const t = profile.onTheirMind.toLowerCase();
    if (/quiet|calm/.test(t)) base.mood = "relaxing";
    else if (/eat|food|hungry/.test(t)) base.mood = "food";
    else if (/night|late|bar/.test(t)) base.mood = "nightlife";
  }

  return base;
}

export function normalizeConciergeResponse(data: Record<string, unknown>): {
  reply: string;
  profile?: Partial<GuestProfile>;
  query?: Partial<IntentQuery>;
  actions: MapAction[];
  chips?: Suggestion[];
} {
  const reply =
    (typeof data.reply === "string" && data.reply) ||
    "Tell me what kind of Paris you're craving — I'll shape the map around you.";

  let profile = data.profile as Partial<GuestProfile> | undefined;
  let query = data.query as Partial<IntentQuery> | undefined;
  let actions = Array.isArray(data.actions) ? (data.actions as MapAction[]) : [];

  // Legacy { intent, mapActions } support
  if (!query && data.intent) {
    query = data.intent as Partial<IntentQuery>;
  }
  const legacy = data.mapActions as Record<string, unknown> | undefined;
  if (legacy) {
    const relight: MapAction = { type: "relight" };
    if (legacy.hour != null) relight.hour = legacy.hour as number;
    if (legacy.rain != null) relight.rain = legacy.rain as boolean;
    if (legacy.lightPreset != null) relight.lightPreset = legacy.lightPreset as MapAction["lightPreset"];
    if (relight.hour != null || relight.rain != null || relight.lightPreset) actions.push(relight);
  }

  if (query?.mood) {
    actions.unshift({ type: "setAccent", mood: query.mood });
  }

  const chips = parseModelChips(data.chips);

  return { reply, profile, query, actions, ...(chips.length ? { chips } : {}) };
}

export function findFeature(
  geojson: ParisFeatureCollection | null,
  placeId?: string,
  placeName?: string,
): ParisFeature | null {
  if (!geojson?.features.length) return null;
  if (placeId) {
    const byId = geojson.features.find((f) => f.properties.id === placeId);
    if (byId) return byId;
  }
  if (placeName) {
    const n = placeName.toLowerCase();
    return geojson.features.find((f) => f.properties.name.toLowerCase().includes(n)) ?? null;
  }
  return null;
}

export function profileContextLine(profile: GuestProfile, traitKeys: string[]): string {
  const parts: string[] = [];
  if (profile.name) parts.push(`Name: ${profile.name}`);
  if (profile.language) parts.push(`Language: ${profile.language}`);
  if (profile.visitorType) parts.push(`Guest type: ${profile.visitorType}`);
  if (profile.companions) parts.push(`With: ${profile.companions}`);
  if (profile.onTheirMind) parts.push(`On their mind: ${profile.onTheirMind}`);
  if (profile.tasteOfHome) parts.push(`Taste of home: ${profile.tasteOfHome}`);
  if (profile.dietary) parts.push(`Dietary: ${profile.dietary}`);
  if (profile.accessibility) parts.push(`Accessibility: ${profile.accessibility}`);
  if (profile.budget) parts.push(`Budget: ${profile.budget}`);
  if (traitKeys.length) parts.push(`Learned signals: ${traitKeys.join(", ")}`);
  return parts.length ? parts.join(". ") : "New guest — greet warmly, one question.";
}

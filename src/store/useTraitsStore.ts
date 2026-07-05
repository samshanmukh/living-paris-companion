import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { computeKnowsYou, extractTraits, type Trait } from "@/lib/traitsExtractor";
import { profileContextLine } from "@/lib/concierge";
import { personaByKey } from "@/lib/personas";
import type { GuestProfile, IntentQuery } from "@/lib/types";
import { mergeProfile } from "@/lib/concierge";
import { useUIStore } from "@/store/useUIStore";

interface TraitsState {
  userId: string | null;
  traits: Record<Trait, number>;
  profile: GuestProfile;
  intent: Partial<IntentQuery>;
  turns: number;
  lastAdded: Trait[];
  ready: boolean;
  init: () => Promise<void>;
  ingest: (text: string, intent?: Partial<IntentQuery>) => void;
  mergeGuestProfile: (partial?: Partial<GuestProfile> | null) => void;
  buildGuestContext: () => string;
  reset: () => void;
}

const LS_KEY = "living-paris.traits.v1";

function loadLocal(): {
  traits: Record<Trait, number>;
  profile: GuestProfile;
  intent: Partial<IntentQuery>;
  turns: number;
} {
  if (typeof window === "undefined") {
    return { traits: {} as Record<Trait, number>, profile: {}, intent: {}, turns: 0 };
  }
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        traits: p.traits ?? {},
        profile: p.profile ?? {},
        intent: p.intent ?? {},
        turns: p.turns ?? 0,
      };
    }
  } catch {}
  return { traits: {} as Record<Trait, number>, profile: {}, intent: {}, turns: 0 };
}

function saveLocal(state: {
  traits: Record<Trait, number>;
  profile: GuestProfile;
  intent: Partial<IntentQuery>;
  turns: number;
}) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {}
}

async function syncCloud(
  userId: string,
  s: { traits: Record<Trait, number>; profile: GuestProfile; intent: Partial<IntentQuery>; turns: number },
) {
  try {
    await supabase.from("user_profile").upsert({
      user_id: userId,
      traits: JSON.parse(JSON.stringify({ ...s.traits, _guestProfile: s.profile })),
      intent: JSON.parse(JSON.stringify(s.intent)),
      turns: s.turns,
      updated_at: new Date().toISOString(),
    });
  } catch { /* best-effort */ }
}

export const useTraitsStore = create<TraitsState>((set, get) => ({
  userId: null,
  traits: {} as Record<Trait, number>,
  profile: {},
  intent: {},
  turns: 0,
  lastAdded: [],
  ready: false,

  mergeGuestProfile: (partial) => {
    if (!partial) return;
    const profile = mergeProfile(get().profile, partial);
    const next = { ...get(), profile };
    set({ profile });
    saveLocal({ traits: next.traits, profile, intent: next.intent, turns: next.turns });
    const uid = get().userId;
    if (uid) void syncCloud(uid, { traits: next.traits, profile, intent: next.intent, turns: next.turns });
  },

  buildGuestContext: () => {
    const persona = useUIStore.getState().activePersona;
    const base = profileContextLine(get().profile, Object.keys(get().traits), persona);
    const hint = personaByKey(persona)?.conciergeHint;
    return hint ? `${base}. ${hint}` : base;
  },

  init: async () => {
    // 1. Load local instantly for zero flash.
    const local = loadLocal();
    set({ ...local, ready: true });
    // 2. Sign in anonymously if needed.
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      let userId = sessionData.session?.user.id ?? null;
      if (!userId) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
        userId = data.user?.id ?? null;
      }
      if (!userId) return;
      set({ userId });
      // 3. Merge cloud into local (cloud wins if it has more turns).
      const { data: row } = await supabase
        .from("user_profile")
        .select("traits, intent, turns")
        .eq("user_id", userId)
        .maybeSingle();
      if (row && (row.turns ?? 0) > local.turns) {
        const rowTraits = (row.traits as Record<string, unknown>) ?? {};
        const guestProfile = (rowTraits._guestProfile as GuestProfile | undefined) ?? local.profile;
        const traits = { ...rowTraits } as Record<Trait, number>;
        delete (traits as Record<string, unknown>)._guestProfile;
        const merged = {
          traits,
          profile: guestProfile,
          intent: (row.intent as Partial<IntentQuery>) ?? {},
          turns: row.turns ?? 0,
        };
        set(merged);
        saveLocal(merged);
      } else {
        void syncCloud(userId, local);
      }
    } catch {
      /* offline or auth blocked — client-only mode */
    }
  },

  ingest: (text, incomingIntent) => {
    const added = extractTraits(text);
    const traits = { ...get().traits };
    const lastAdded: Trait[] = [];
    for (const t of added) {
      if (!traits[t]) lastAdded.push(t);
      traits[t] = (traits[t] ?? 0) + 1;
    }
    const intent = { ...get().intent, ...(incomingIntent ?? {}) };
    // Drop transient center/lat/lon from accumulated intent
    delete (intent as { lat?: number }).lat;
    delete (intent as { lon?: number }).lon;
    const turns = get().turns + 1;
    const next = { traits, profile: get().profile, intent, turns };
    set({ ...next, lastAdded });
    saveLocal(next);
    const uid = get().userId;
    if (uid) void syncCloud(uid, next);
  },

  reset: () => {
    const next = { traits: {} as Record<Trait, number>, profile: {} as GuestProfile, intent: {}, turns: 0 };
    set({ ...next, lastAdded: [] });
    saveLocal(next);
    const uid = get().userId;
    if (uid) void syncCloud(uid, next);
  },
}));

export function selectKnowsYou(s: TraitsState): number {
  return computeKnowsYou(Object.keys(s.traits).length, s.turns);
}

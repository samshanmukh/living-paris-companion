import { create } from "zustand";
import { parseIntent, planRoute, spatialQuery } from "@/lib/api";
import { detectLocationCommand, geocodeParis, geolocateDevice } from "@/lib/geocode";
import { useTraitsStore } from "@/store/useTraitsStore";
import { useSceneStore } from "@/store/useSceneStore";
import { isRainFriendly } from "@/lib/rainMode";
import type { IntentQuery, MoodType, ParisFeature, ParisFeatureCollection, RouteResponse, RouteWaypoint } from "@/lib/types";

export type ChatMessage = { role: "user" | "ai"; text: string; places?: ParisFeature[] };

export type MapActions = {
  hour?: number | null;
  rain?: boolean | null;
  lightPreset?: "dawn" | "day" | "dusk" | "night" | null;
};

async function chatWithParis(
  history: ChatMessage[],
  userText: string,
  memoryHint?: string,
): Promise<{ reply: string; intent: IntentQuery; mapActions?: MapActions }> {
  const system = memoryHint
    ? { role: "system", content: `Context about this visitor: ${memoryHint}` }
    : null;
  const messages = [
    ...(system ? [system] : []),
    ...history.map((m) => ({ role: m.role === "ai" ? "assistant" : "user", content: m.text })),
    { role: "user", content: userText },
  ];
  const r = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  const data = await r.json();
  if (!r.ok || data.error) {
    throw new Error(data.reply ?? `Grok chat failed (${r.status})`);
  }
  const intent: IntentQuery = { lat: 48.8566, lon: 2.3522, walk: 15, ...(data.intent ?? {}) };
  return {
    reply: data.reply ?? "Here's what I'd choose.",
    intent,
    mapActions: data.mapActions as MapActions | undefined,
  };
}

function applyMapActions(actions: MapActions | undefined, intent: IntentQuery) {
  const scene = useSceneStore.getState();
  if (actions?.hour != null) scene.setHour(actions.hour);
  else if (actions?.lightPreset === "night") scene.setHour(23);
  else if (actions?.lightPreset === "dusk") scene.setHour(19);
  else if (actions?.lightPreset === "dawn") scene.setHour(6);
  else if (actions?.lightPreset === "day") scene.setHour(12);

  if (actions?.rain === true) scene.setRain(true);
  else if (actions?.rain === false) scene.setRain(false);
  else if (intent.rainy || intent.mood === "rainy") scene.setRain(true);
  else if (intent.mood === "nightlife") scene.setHour(23);
  else if (intent.mood === "relaxing") scene.setHour(8);
}

function speakWithBrowser(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = 1.02;
    utter.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  } catch { /* ignore */ }
}

async function speak(text: string) {
  try {
    const r = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const ct = r.headers.get("Content-Type") ?? "";
    if (!r.ok || ct.includes("application/json")) { speakWithBrowser(text); return; }
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onended = () => URL.revokeObjectURL(url);
    void audio.play().catch(() => speakWithBrowser(text));
  } catch { speakWithBrowser(text); }
}

function diffLabels(prev: MoodType, next: MoodType, prevCount: number, nextCount: number, rainOn: boolean): string[] {
  const out: string[] = [];
  if (prev !== next) out.push(`Mood → ${next}`);
  if (nextCount !== prevCount) out.push(`${nextCount} places`);
  if (rainOn) out.push("Rain-aware");
  return out.slice(0, 3);
}

// ── Voice-command interception ─────────────────────────────────────────────
// Returns true when a command was fully handled (skip normal chat).
function detectVoiceCommand(raw: string): {
  kind: "rain-on" | "rain-off" | "accessible" | "start-route" | "night" | "dawn" | null;
  reply?: string;
} {
  const t = raw.toLowerCase();
  if (/\b(it'?s raining|its raining|actually.*rain|start(ed)? raining|now it'?s raining|make it rain)\b/.test(t))
    return { kind: "rain-on", reply: "Rain moving in. Swapping to covered stops." };
  if (/\b(stopped raining|rain stopped|no more rain|clear skies|sunny again)\b/.test(t))
    return { kind: "rain-off", reply: "Skies clearing. Outdoor spots are back on." };
  if (/\b(wheelchair|step[- ]?free|accessible|mobility|my mom|elevator only)\b/.test(t))
    return { kind: "accessible", reply: "Understood. Rerouting step-free — this path avoids every stair." };
  if (
    /\b(i like this|start\s+(?:the\s+)?(?:\w+\s+){0,3}route|start directions|take me|let'?s go|navigate|go there|book it|do it|begin (?:the )?walk|show (?:me )?(?:the )?route)\b/.test(t)
  )
    return { kind: "start-route", reply: "On our way — drawing your route now." };
  if (/\b(make it night|it'?s night|after dark|nighttime)\b/.test(t))
    return { kind: "night", reply: "Turning down the lights." };
  if (/\b(dawn|sunrise|morning light)\b/.test(t))
    return { kind: "dawn", reply: "Bringing up the dawn." };
  return { kind: null };
}

interface CityState {
  messages: ChatMessage[];
  mood: MoodType;
  geojson: ParisFeatureCollection | null;
  center: [number, number];
  selected: ParisFeature | null;
  hoveredId: string | null;
  route: RouteResponse | null;
  routeWaypoints: RouteWaypoint[] | null;
  routeError: string | null;
  isRouting: boolean;
  isThinking: boolean;
  pipelineStep: number;
  hasSent: boolean;
  error: string | null;
  lastChanged: string[];
  rainMode: boolean;
  liveTranscript: string;
  accessibleMode: boolean;
  userLocation: [number, number] | null;
  locationLabel: string | null;
  send: (text: string) => Promise<void>;
  select: (f: ParisFeature) => Promise<void>;
  routeToPlace: (f: ParisFeature) => Promise<void>;
  hover: (id: string | null) => void;
  clearSelection: () => void;
  planItinerary: (stops: ParisFeature[]) => Promise<void>;
  setRainMode: (on: boolean) => Promise<void>;
  setAccessibleMode: (on: boolean) => void;
  setLiveTranscript: (t: string) => void;
  setUserLocation: (loc: [number, number] | null, label?: string | null) => void;
  startRoute: () => Promise<void>;
  clearRoute: () => void;
}

export const useCityStore = create<CityState>((set, get) => ({
  messages: [],
  mood: "general",
  geojson: null,
  center: [2.3522, 48.8566],
  selected: null,
  hoveredId: null,
  route: null,
  routeWaypoints: null,
  routeError: null,
  isRouting: false,
  isThinking: false,
  pipelineStep: 0,
  hasSent: false,
  error: null,
  lastChanged: [],
  rainMode: false,
  liveTranscript: "",
  accessibleMode: false,
  userLocation: null,
  locationLabel: null,

  setLiveTranscript: (t) => set({ liveTranscript: t }),
  setUserLocation: (loc, label = null) =>
    set({ userLocation: loc, locationLabel: label, ...(loc ? { center: loc } : {}) }),
  setAccessibleMode: (on) => set({ accessibleMode: on, mood: on ? "relaxing" : get().mood }),

  send: async (text: string) => {
    const clean = text.trim();
    if (!clean) return;

    // Show optimistic user message
    set((s) => ({
      messages: [...s.messages, { role: "user", text: clean }],
      hasSent: true,
      liveTranscript: "",
    }));

    // ── Location via voice ("I'm near République", "use my location") ───
    const locCmd = detectLocationCommand(clean);
    if (locCmd) {
      set({ isThinking: true, pipelineStep: 0 });
      let coords: [number, number] | null = null;
      let label = "Paris";

      if (locCmd.kind === "geolocate") {
        coords = await geolocateDevice();
        label = "Here";
      } else {
        const res = await geocodeParis(locCmd.query);
        if (res) {
          coords = res.coords;
          label = res.label.split(",")[0].trim();
        }
      }

      set({ isThinking: false, pipelineStep: 0 });

      if (!coords) {
        const reply = "I couldn't find that spot — try a metro stop or arrondissement?";
        set((s) => ({ messages: [...s.messages, { role: "ai", text: reply }] }));
        void speak(reply);
        return;
      }

      get().setUserLocation(coords, label);
      const reply =
        locCmd.kind === "geolocate"
          ? `Got you — I'm centering on where you are. Routes will start from here.`
          : `Perfect — I'll plan from ${label}. Tell me what kind of day you want.`;
      set((s) => ({ messages: [...s.messages, { role: "ai", text: reply }] }));
      void speak(reply);
      return;
    }

    // ── Voice-command shortcut path ─────────────────────────────────────
    const cmd = detectVoiceCommand(clean);
    if (cmd.kind) {
      const reply = cmd.reply ?? "Done.";
      set((s) => ({
        messages: [...s.messages, { role: "ai", text: reply }],
      }));
      void speak(reply);

      switch (cmd.kind) {
        case "rain-on":
          await get().setRainMode(true);
          break;
        case "rain-off":
          await get().setRainMode(false);
          break;
        case "accessible": {
          get().setAccessibleMode(true);
          // Filter existing features by accessible flag if we have any
          const geo = get().geojson;
          if (geo && geo.features.length) {
            const acc = geo.features.filter((f) => f.properties.accessible !== false).slice(0, 4);
            if (acc.length >= 2) await get().planItinerary(acc);
          }
          set({ lastChanged: ["Step-free route", "Lift-equipped metro"] });
          setTimeout(() => set({ lastChanged: [] }), 3200);
          break;
        }
        case "start-route": {
          await get().startRoute();
          break;
        }
        case "night":
          useSceneStore.getState().setHour(22);
          break;
        case "dawn":
          useSceneStore.getState().setHour(6);
          break;
      }
      return;
    }

    // ── Normal chat + spatial query path ────────────────────────────────
    const priorMessages = get().messages.slice(0, -1); // exclude the just-pushed user msg
    const prevMood = get().mood;
    const prevCount = get().geojson?.features.length ?? 0;
    set({ isThinking: true, pipelineStep: 0, lastChanged: [] });

    try {
      useTraitsStore.getState().ingest(clean);
      const traitState = useTraitsStore.getState();
      const memoryHint = Object.keys(traitState.traits).length
        ? "Learned traits: " + Object.keys(traitState.traits).join(", ")
        : undefined;

      let reply: string;
      let intent: IntentQuery;
      let mapActions: MapActions | undefined;
      try {
        set({ pipelineStep: 1 });
        const out = await chatWithParis(priorMessages, clean, memoryHint);
        reply = out.reply;
        intent = out.intent;
        mapActions = out.mapActions;
        applyMapActions(mapActions, intent);
        if (intent.rainy || mapActions?.rain) await get().setRainMode(true);
      } catch (error) {
        intent = parseIntent(clean);
        applyMapActions(undefined, intent);
        reply = error instanceof Error && !error.message.startsWith("Grok")
          ? error.message
          : "Here's what I'd choose.";
      }

      useTraitsStore.getState().ingest("", intent);
      set({ pipelineStep: 2 });

      const userLoc = get().userLocation;
      if (userLoc) {
        intent = { ...intent, lon: userLoc[0], lat: userLoc[1] };
      }

      const result = await spatialQuery(intent);
      set({ pipelineStep: 3 });

      const mapCenter = userLoc ?? result.meta.center;

      const rainOn = get().rainMode;
      const places = (result.geojson.features ?? []).slice(0, 4);
      const nextMood: MoodType = intent.mood ?? "general";
      set((s) => ({
        mood: nextMood,
        geojson: result.geojson,
        center: mapCenter,
        route: null,
        routeWaypoints: null,
        routeError: null,
        selected: null,
        isThinking: false,
        pipelineStep: 0,
        messages: [...s.messages, { role: "ai", text: reply, places }],
        lastChanged: diffLabels(prevMood, nextMood, prevCount, result.geojson.features.length, rainOn),
      }));

      setTimeout(() => set({ lastChanged: [] }), 3200);
      void speak(reply);
    } catch {
      set(() => ({
        isThinking: false,
        pipelineStep: 0,
        error: "Couldn't reach Paris — retry?",
        messages: [...get().messages, { role: "ai", text: "Couldn't reach Paris — is the API running?" }],
      }));
    }
  },

  hover: (id) => set({ hoveredId: id }),
  clearSelection: () => set({ selected: null }),

  select: (f: ParisFeature) => {
    const [lon, lat] = f.geometry.coordinates as [number, number];
    set({ selected: f, center: [lon, lat] });
  },

  routeToPlace: async (f: ParisFeature) => {
    const [lon, lat] = f.geometry.coordinates as [number, number];
    const start = get().userLocation ?? get().center;
    const waypoints: RouteWaypoint[] = [
      { lon: start[0], lat: start[1], name: get().locationLabel ? `You · ${get().locationLabel}` : "Start" },
      { lon, lat, name: f.properties.name, id: f.properties.id },
    ];
    set({ isRouting: true, routeError: null });
    try {
      const route = await planRoute(waypoints);
      set({
        route,
        routeWaypoints: waypoints,
        lastChanged: [`Route · to ${f.properties.name}`],
      });
      setTimeout(() => set({ lastChanged: [] }), 3200);
    } catch {
      set({
        route: null,
        routeWaypoints: null,
        routeError: "Couldn't draw route — check your connection",
        lastChanged: ["Couldn't draw route — try again"],
      });
      setTimeout(() => set({ lastChanged: [] }), 3200);
    } finally {
      set({ isRouting: false });
    }
  },

  startRoute: async () => {
    const geo = get().geojson;
    if (geo && geo.features.length >= 2) {
      await get().planItinerary(geo.features.slice(0, 3));
      return;
    }
    if (geo?.features.length === 1) {
      await get().routeToPlace(geo.features[0]);
      return;
    }
    const selected = get().selected;
    if (selected) {
      await get().routeToPlace(selected);
      return;
    }
    const msg = "Plan a walk first, or tap a place on the map.";
    set({ routeError: msg });
    setTimeout(() => set({ routeError: null }), 4000);
  },

  clearRoute: () => set({ route: null, routeWaypoints: null, routeError: null }),

  planItinerary: async (stops: ParisFeature[]) => {
    if (stops.length < 1) return;
    const start = get().userLocation ?? get().center;
    const waypoints: RouteWaypoint[] = [
      { lon: start[0], lat: start[1], name: get().locationLabel ? `You · ${get().locationLabel}` : "Start" },
      ...stops.map((s) => {
        const [lon, lat] = s.geometry.coordinates as [number, number];
        return { lon, lat, name: s.properties.name, id: s.properties.id };
      }),
    ];
    if (waypoints.length < 2) return;
    set({ isRouting: true, routeError: null });
    try {
      const route = await planRoute(waypoints);
      set({
        route,
        routeWaypoints: waypoints,
        lastChanged: [`Route · ${stops.length} stops · ${Math.round(route.durationMinutes)} min`],
      });
      setTimeout(() => set({ lastChanged: [] }), 3200);
    } catch {
      set({
        route: null,
        routeWaypoints: null,
        routeError: "Couldn't draw route — check your connection",
        lastChanged: ["Couldn't draw route — check connection"],
      });
      setTimeout(() => set({ lastChanged: [] }), 3200);
    } finally {
      set({ isRouting: false });
    }
  },

  setRainMode: async (on: boolean) => {
    const geo = get().geojson;
    set({ rainMode: on, mood: on ? "rainy" : get().mood, lastChanged: on ? ["Rain-aware", "Swapped rooftop → covered passage"] : ["Rain cleared"] });
    setTimeout(() => set({ lastChanged: [] }), 3200);
    if (on && geo && geo.features.length >= 2) {
      const covered = geo.features.filter(isRainFriendly).slice(0, 4);
      if (covered.length >= 2) {
        await get().planItinerary(covered);
      }
    }
  },
}));

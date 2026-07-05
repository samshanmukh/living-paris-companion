import { create } from "zustand";
import { parseIntent, planRoute, spatialQuery } from "@/lib/api";
import { mergeQuery, normalizeConciergeResponse } from "@/lib/concierge";
import { executeMapActions } from "@/lib/executeMapActions";
import { detectLocationCommand, geocodeParis, geolocateDevice } from "@/lib/geocode";
import { waypointsFromFeatures } from "@/lib/routePreview";
import { livingFollowUp } from "@/lib/livingPrompt";
import { buildItineraries } from "@/lib/itinerary";
import { useUIStore } from "@/store/useUIStore";
import { useTraitsStore } from "@/store/useTraitsStore";
import { useSceneStore } from "@/store/useSceneStore";
import { isRainFriendly } from "@/lib/rainMode";
import { refinePlacesForIntent } from "@/lib/placeSearch";
import type { MapFocus } from "@/lib/mapCamera";
import type {
  IntentQuery,
  MapAction,
  MapAnnotation,
  MoodType,
  ParisFeature,
  ParisFeatureCollection,
  RouteResponse,
  RouteWaypoint,
  SpatialQueryResult,
} from "@/lib/types";

export type ChatMessage = { role: "user" | "ai"; text: string; places?: ParisFeature[] };

/** Controls whether route planning also posts a second chat bubble. */
export type RouteOptions = {
  announce?: boolean;
  preview?: boolean;
};

const SILENT_ROUTE: RouteOptions = { announce: false, preview: false };

async function chatWithParis(
  history: ChatMessage[],
  userText: string,
  guestContext: string,
) {
  const messages = [
    ...history.map((m) => ({ role: m.role === "ai" ? "assistant" : "user", content: m.text })),
    { role: "user", content: userText },
  ];
  const r = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, guestContext }),
  });
  const data = await r.json();
  if (!r.ok || data.error) {
    throw new Error(data.reply ?? `Chat failed (${r.status})`);
  }
  return normalizeConciergeResponse(data as Record<string, unknown>);
}

function needsSpatialQuery(
  query: Partial<IntentQuery> | undefined,
  actions: MapAction[],
  merged: IntentQuery,
): boolean {
  if (actions.some((a) => a.type === "highlight" || a.type === "route" || a.type === "save")) {
    return true;
  }
  if (merged.mood && merged.mood !== "general") return true;
  if (query && Object.keys(query).some((k) => !["lat", "lon", "walk"].includes(k))) return true;
  return false;
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

let activeAudio: HTMLAudioElement | null = null;

async function speak(text: string) {
  const clean = text.trim();
  if (!clean) return;
  try {
    activeAudio?.pause();
    activeAudio = null;

    const r = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: clean }),
    });
    const ct = r.headers.get("Content-Type") ?? "";

    if (ct.includes("application/json")) {
      speakWithBrowser(clean);
      return;
    }
    if (!r.ok) {
      speakWithBrowser(clean);
      return;
    }

    const blob = await r.blob();
    if (blob.size < 128) {
      speakWithBrowser(clean);
      return;
    }

    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    activeAudio = audio;
    audio.onended = () => {
      URL.revokeObjectURL(url);
      if (activeAudio === audio) activeAudio = null;
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      if (activeAudio === audio) activeAudio = null;
      speakWithBrowser(clean);
    };
    await audio.play();
  } catch {
    speakWithBrowser(clean);
  }
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
    return { kind: "start-route", reply: "Let's live this one — I'll walk you through each stop." };
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
  mapFocus: MapFocus | null;
  mapFocusTick: number;
  activeRouteStop: number;
  selectionTick: number;
  highlightedIds: string[];
  mapAnnotation: MapAnnotation | null;
  routePreviewPlaying: boolean;
  routePreviewStop: number;
  routePreviewProgress: number;
  routePreviewGeneration: number;
  activeExperienceIndex: number;
  setHighlightedIds: (ids: string[]) => void;
  setMapAnnotation: (a: MapAnnotation | null) => void;
  setMoodFromAction: (mood: MoodType) => void;
  send: (text: string) => Promise<void>;
  select: (f: ParisFeature) => void;
  routeToPlace: (f: ParisFeature, opts?: RouteOptions) => Promise<void>;
  hover: (id: string | null) => void;
  clearSelection: () => void;
  planItinerary: (stops: ParisFeature[], opts?: RouteOptions) => Promise<void>;
  setRainMode: (on: boolean) => Promise<void>;
  setAccessibleMode: (on: boolean) => void;
  setLiveTranscript: (t: string) => void;
  setUserLocation: (loc: [number, number] | null, label?: string | null) => void;
  setMapFocus: (focus: MapFocus) => void;
  focusRouteOverview: () => void;
  focusRouteStop: (stopIndex: number) => void;
  nextRouteStop: () => void;
  prevRouteStop: () => void;
  startRoute: (opts?: RouteOptions) => Promise<void>;
  clearRoute: () => void;
  skipRoutePreview: () => void;
  finishRoutePreview: () => void;
  setActiveExperienceIndex: (index: number) => void;
  focusExperience: (index?: number) => void;
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
  mapFocus: null,
  mapFocusTick: 0,
  activeRouteStop: 0,
  selectionTick: 0,
  highlightedIds: [],
  mapAnnotation: null,
  routePreviewPlaying: false,
  routePreviewStop: 0,
  routePreviewProgress: 0,
  routePreviewGeneration: 0,
  activeExperienceIndex: 0,

  setHighlightedIds: (ids) => set({ highlightedIds: ids }),
  setMapAnnotation: (a) => set({ mapAnnotation: a }),
  setMoodFromAction: (mood) => set({ mood }),

  setMapFocus: (focus) => set((s) => ({ mapFocus: focus, mapFocusTick: s.mapFocusTick + 1 })),
  focusRouteOverview: () => {
    set({ activeRouteStop: 0 });
    get().setMapFocus({ kind: "route-overview" });
  },
  focusRouteStop: (stopIndex) => {
    const wps = get().routeWaypoints;
    if (!wps?.length || stopIndex < 0 || stopIndex >= wps.length) return;
    set({ activeRouteStop: stopIndex });
    get().setMapFocus({ kind: "route-stop", stopIndex });
  },
  nextRouteStop: () => {
    const wps = get().routeWaypoints;
    if (!wps?.length) return;
    const next = Math.min(get().activeRouteStop + 1, wps.length - 1);
    get().focusRouteStop(next);
  },
  prevRouteStop: () => {
    const prev = Math.max(get().activeRouteStop - 1, 0);
    get().focusRouteStop(prev);
  },

  skipRoutePreview: () => {
    set((s) => ({
      routePreviewPlaying: false,
      routePreviewGeneration: s.routePreviewGeneration + 1,
      routePreviewProgress: 1,
    }));
    get().focusRouteOverview();
  },

  finishRoutePreview: () => {
    set({ routePreviewPlaying: false, routePreviewProgress: 1 });
  },

  setActiveExperienceIndex: (index) => set({ activeExperienceIndex: index }),

  focusExperience: (index) => {
    const geo = get().geojson;
    if (!geo?.features.length) return;
    const idx = index ?? get().activeExperienceIndex;
    const plans = buildItineraries(geo.features, get().center, {
      mood: get().mood,
      rainMode: get().rainMode,
    });
    const stops = plans[idx]?.stops ?? geo.features.slice(0, 4);
    set({ activeExperienceIndex: idx, highlightedIds: stops.map((s) => s.properties.id) });
    const coords = stops.map((f) => f.geometry.coordinates as [number, number]);
    if (coords.length >= 2) {
      get().setMapFocus({ kind: "places-overview", coords });
    } else if (coords.length === 1) {
      get().setMapFocus({ kind: "place", lon: coords[0][0], lat: coords[0][1] });
    }
  },

  setLiveTranscript: (t) => set({ liveTranscript: t }),
  setUserLocation: (loc, label = null) => {
    set({ userLocation: loc, locationLabel: label, ...(loc ? { center: loc } : {}) });
    if (loc) get().setMapFocus({ kind: "place", lon: loc[0], lat: loc[1] });
  },
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
            if (acc.length >= 2) await get().planItinerary(acc, SILENT_ROUTE);
          }
          set({ lastChanged: ["Step-free route", "Lift-equipped metro"] });
          setTimeout(() => set({ lastChanged: [] }), 3200);
          break;
        }
        case "start-route": {
          await get().startRoute(SILENT_ROUTE);
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
    const priorMessages = get().messages.slice(0, -1);
    const prevMood = get().mood;
    const prevCount = get().geojson?.features.length ?? 0;
    set({ isThinking: true, pipelineStep: 0, lastChanged: [], highlightedIds: [], mapAnnotation: null });

    try {
      useTraitsStore.getState().ingest(clean);
      const traitsStore = useTraitsStore.getState();
      const guestContext = traitsStore.buildGuestContext();

      let reply: string;
      let query: Partial<IntentQuery> | undefined;
      let actions: MapAction[] = [];
      try {
        set({ pipelineStep: 1 });
        const out = await chatWithParis(priorMessages, clean, guestContext);
        reply = out.reply;
        query = out.query;
        actions = out.actions;
        if (out.profile) traitsStore.mergeGuestProfile(out.profile);
      } catch (error) {
        query = parseIntent(clean);
        reply = error instanceof Error && !error.message.startsWith("Grok")
          ? error.message
          : "Here's what I'd choose.";
      }

      const mergedQuery = mergeQuery(
        useTraitsStore.getState().intent,
        query,
        useTraitsStore.getState().profile,
      );
      useTraitsStore.getState().ingest("", mergedQuery);

      const userLoc = get().userLocation;
      if (userLoc) {
        mergedQuery.lon = userLoc[0];
        mergedQuery.lat = userLoc[1];
      }

      let result: SpatialQueryResult | null = null;
      if (needsSpatialQuery(query, actions, mergedQuery)) {
        set({ pipelineStep: 2 });
        result = await spatialQuery(mergedQuery);
        set({ pipelineStep: 3 });
      }

      const geojson = result?.geojson ?? get().geojson;
      const mapCenter = userLoc ?? result?.meta.center ?? get().center;
      const rainFromActions = actions.some((a) => a.type === "relight" && a.rain === true);
      const sourceFeatures = geojson?.features ?? [];
      const refinedFeatures = sourceFeatures.length
        ? refinePlacesForIntent(sourceFeatures, mergedQuery, {
            rainMode: get().rainMode || rainFromActions || mergedQuery.mood === "rainy",
            accessibleMode: get().accessibleMode,
            center: mapCenter,
          })
        : [];
      const refinedGeojson = geojson
        ? { ...geojson, features: refinedFeatures, type: "FeatureCollection" as const }
        : null;

      if (actions.length) {
        await executeMapActions(actions, refinedGeojson, {
          setMapFocus: get().setMapFocus,
          startRoute: (opts) => get().startRoute(opts),
          select: get().select,
          setRainMode: get().setRainMode,
          setHighlightedIds: get().setHighlightedIds,
          setMapAnnotation: get().setMapAnnotation,
          setMoodFromAction: get().setMoodFromAction,
        });
      }

      const rainOn = get().rainMode;
      const places = refinedFeatures.slice(0, 4);
      const nextMood: MoodType = mergedQuery.mood ?? get().mood;
      const choreographed = actions.some((a) => a.type === "flyTo" || a.type === "highlight");

      set((s) => ({
        mood: nextMood,
        ...(result || refinedFeatures.length
          ? {
              geojson: {
                type: "FeatureCollection" as const,
                features: refinedFeatures,
              },
              center: mapCenter,
              route: null,
              routeWaypoints: null,
              routeError: null,
              selected: null,
              activeExperienceIndex: 0,
            }
          : {}),
        isThinking: false,
        pipelineStep: 0,
        messages: [...s.messages, { role: "ai", text: reply, places: result ? places : undefined }],
        lastChanged: result || refinedFeatures.length
          ? diffLabels(prevMood, nextMood, prevCount, refinedFeatures.length, rainOn)
          : [],
      }));

      setTimeout(() => set({ lastChanged: [] }), 3200);
      void speak(reply);

      if (refinedFeatures.length) {
        get().focusExperience(0);
      } else if (result && !choreographed) {
        const placeCoords = places
          .map((f) => f.geometry.coordinates as [number, number])
          .filter((c) => c.length === 2);
        if (placeCoords.length >= 2) {
          get().setMapFocus({ kind: "places-overview", coords: placeCoords });
        } else if (placeCoords.length === 1) {
          get().setMapFocus({ kind: "place", lon: placeCoords[0][0], lat: placeCoords[0][1] });
        }
      }
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
    set((s) => ({ selected: f, center: [lon, lat], selectionTick: s.selectionTick + 1 }));
    get().setMapFocus({ kind: "place", lon, lat });
  },

  routeToPlace: async (f: ParisFeature, opts: RouteOptions = {}) => {
    const announce = opts.announce ?? true;
    const [lon, lat] = f.geometry.coordinates as [number, number];
    const start = get().userLocation ?? get().center;
    const waypoints: RouteWaypoint[] = [
      { lon: start[0], lat: start[1], name: get().locationLabel ? `You · ${get().locationLabel}` : "Start" },
      { lon, lat, name: f.properties.name, id: f.properties.id },
    ];
    useUIStore.getState().setAssistantExpanded(true);
    set({ isRouting: true, routeError: null });
    try {
      const route = await planRoute(waypoints);
      const followUp = livingFollowUp([f], get().mood, useTraitsStore.getState().profile.name);
      set((s) => ({
        route,
        routeWaypoints: waypoints,
        activeRouteStop: 1,
        ...(announce ? { messages: [...s.messages, { role: "ai", text: followUp }] } : {}),
        lastChanged: [`Living · ${f.properties.name}`],
      }));
      if (announce) void speak(followUp);
      get().focusRouteStop(1);
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

  startRoute: async (opts: RouteOptions = {}) => {
    useUIStore.getState().setAssistantExpanded(true);
    const geo = get().geojson;
    if (geo?.features.length) {
      const plans = buildItineraries(geo.features, get().center, {
        mood: get().mood,
        rainMode: get().rainMode,
      });
      const active = plans[get().activeExperienceIndex]?.stops ?? geo.features;
      if (active.length >= 2) {
        await get().planItinerary(active, opts);
        return;
      }
      if (active.length === 1) {
        await get().routeToPlace(active[0], opts);
        return;
      }
    }
    const selected = get().selected;
    if (selected) {
      await get().routeToPlace(selected, opts);
      return;
    }
    const msg = "Plan a walk first, or tap a place on the map.";
    set({ routeError: msg });
    setTimeout(() => set({ routeError: null }), 4000);
  },

  clearRoute: () =>
    set((s) => ({
      route: null,
      routeWaypoints: null,
      routeError: null,
      activeRouteStop: 0,
      routePreviewPlaying: false,
      routePreviewStop: 0,
      routePreviewProgress: 0,
      routePreviewGeneration: s.routePreviewGeneration + 1,
    })),

  planItinerary: async (stops: ParisFeature[], opts: RouteOptions = {}) => {
    const announce = opts.announce ?? true;
    const preview = opts.preview ?? true;
    if (stops.length < 2) {
      if (stops.length === 1) await get().routeToPlace(stops[0], opts);
      return;
    }
    const waypoints = waypointsFromFeatures(stops);
    useUIStore.getState().setAssistantExpanded(true);
    set({ isRouting: true, routeError: null });
    try {
      const route = await planRoute(waypoints);
      const followUp = livingFollowUp(
        stops,
        get().mood,
        useTraitsStore.getState().profile.name,
      );
      set((s) => ({
        route,
        routeWaypoints: waypoints,
        activeRouteStop: 0,
        routePreviewStop: 0,
        routePreviewProgress: 0,
        routePreviewPlaying: preview,
        routePreviewGeneration: s.routePreviewGeneration + 1,
        ...(announce ? { messages: [...s.messages, { role: "ai", text: followUp }] } : {}),
        lastChanged: [`Living · ${stops.length} places · ${Math.round(route.durationMinutes)} min`],
      }));
      if (announce) void speak(followUp);
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
        await get().planItinerary(covered, SILENT_ROUTE);
      }
    }
  },
}));

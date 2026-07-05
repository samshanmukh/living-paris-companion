import { create } from "zustand";
import type { ParisAirQualitySnapshot } from "@/lib/types";

export type Season = "spring" | "summer" | "autumn" | "winter";

interface SceneState {
  hourOverride: number | null; // 0-23, null = live
  seasonOverride: Season | null; // null = live
  rainOverride: boolean | null; // null = live, true = force rain mode
  airQualityVisible: boolean;
  airQualitySnapshot: ParisAirQualitySnapshot | null;
  persona: string; // e.g. "flaneur"
  setHour: (h: number | null) => void;
  setSeason: (s: Season | null) => void;
  setRain: (r: boolean | null) => void;
  setAirQualityVisible: (on: boolean) => void;
  toggleAirQuality: () => void;
  setAirQualitySnapshot: (snapshot: ParisAirQualitySnapshot | null) => void;
  setPersona: (p: string) => void;
}

export const useSceneStore = create<SceneState>((set) => ({
  hourOverride: null,
  seasonOverride: null,
  rainOverride: null,
  airQualityVisible: false,
  airQualitySnapshot: null,
  persona: "flaneur",
  setHour: (h) => set({ hourOverride: h }),
  setSeason: (s) => set({ seasonOverride: s }),
  setRain: (r) => set({ rainOverride: r }),
  setAirQualityVisible: (on) => set({ airQualityVisible: on }),
  toggleAirQuality: () => set((s) => ({ airQualityVisible: !s.airQualityVisible })),
  setAirQualitySnapshot: (snapshot) => set({ airQualitySnapshot: snapshot }),
  setPersona: (p) => set({ persona: p }),
}));

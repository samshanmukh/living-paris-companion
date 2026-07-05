import { create } from "zustand";

export type Season = "spring" | "summer" | "autumn" | "winter";

interface SceneState {
  hourOverride: number | null; // 0-23, null = live
  seasonOverride: Season | null; // null = live
  rainOverride: boolean | null; // null = live, true = force rain mode
  persona: string; // e.g. "flaneur"
  setHour: (h: number | null) => void;
  setSeason: (s: Season | null) => void;
  setRain: (r: boolean | null) => void;
  setPersona: (p: string) => void;
}

export const useSceneStore = create<SceneState>((set) => ({
  hourOverride: null,
  seasonOverride: null,
  rainOverride: null,
  persona: "flaneur",
  setHour: (h) => set({ hourOverride: h }),
  setSeason: (s) => set({ seasonOverride: s }),
  setRain: (r) => set({ rainOverride: r }),
  setPersona: (p) => set({ persona: p }),
}));

import { create } from "zustand";

export type PersonaKey =
  | "asthma"
  | "wheelchair"
  | "sensory"
  | "safety"
  | "halal"
  | "date";

export type Destination = {
  name: string;
  address: string;
  lon: number;
  lat: number;
};

interface UIState {
  chatOpen: boolean;
  assistantExpanded: boolean;
  assistantFullscreen: boolean;
  setChatOpen: (v: boolean) => void;
  setAssistantExpanded: (v: boolean) => void;
  setAssistantFullscreen: (v: boolean) => void;
  toggleAssistantFullscreen: () => void;
  activePersona: PersonaKey | null;
  setActivePersona: (p: PersonaKey | null) => void;
  destination: Destination | null;
  setDestination: (d: Destination | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  chatOpen: false,
  assistantExpanded: false,
  assistantFullscreen: false,
  setChatOpen: (v) => set({ chatOpen: v }),
  setAssistantExpanded: (v) => set({ assistantExpanded: v }),
  setAssistantFullscreen: (v) => set({ assistantFullscreen: v }),
  toggleAssistantFullscreen: () =>
    set((s) => ({ assistantFullscreen: !s.assistantFullscreen, assistantExpanded: true })),
  activePersona: null,
  setActivePersona: (p) => set({ activePersona: p }),
  destination: null,
  setDestination: (d) => set({ destination: d }),
}));

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
  setChatOpen: (v: boolean) => void;
  activePersona: PersonaKey | null;
  setActivePersona: (p: PersonaKey | null) => void;
  destination: Destination | null;
  setDestination: (d: Destination | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  chatOpen: false,
  setChatOpen: (v) => set({ chatOpen: v }),
  activePersona: null,
  setActivePersona: (p) => set({ activePersona: p }),
  destination: null,
  setDestination: (d) => set({ destination: d }),
}));

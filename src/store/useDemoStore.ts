import { create } from "zustand";

interface DemoState {
  active: boolean;
  toggle: () => void;
  activate: () => void;
  deactivate: () => void;
}

export const useDemoStore = create<DemoState>((set, get) => ({
  active: false,
  toggle: () => set({ active: !get().active }),
  activate: () => set({ active: true }),
  deactivate: () => set({ active: false }),
}));

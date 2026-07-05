import { create } from "zustand";
import type { ParisFeature } from "@/lib/types";

const KEY = "lp.prefs.v1";

interface Persisted {
  reducedMotion: boolean;
  highContrast: boolean;
  favorites: ParisFeature[];
}

interface PrefsState extends Persisted {
  favoritesOpen: boolean;
  toggleReducedMotion: () => void;
  toggleHighContrast: () => void;
  toggleFavorite: (f: ParisFeature) => void;
  isFavorite: (id: string) => boolean;
  setFavoritesOpen: (v: boolean) => void;
}

function load(): Persisted {
  if (typeof window === "undefined") {
    return { reducedMotion: false, highContrast: false, favorites: [] };
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) throw new Error();
    const p = JSON.parse(raw) as Partial<Persisted>;
    return {
      reducedMotion: !!p.reducedMotion,
      highContrast: !!p.highContrast,
      favorites: Array.isArray(p.favorites) ? p.favorites : [],
    };
  } catch {
    return { reducedMotion: false, highContrast: false, favorites: [] };
  }
}

function persist(s: Persisted) {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        reducedMotion: s.reducedMotion,
        highContrast: s.highContrast,
        favorites: s.favorites,
      })
    );
  } catch {}
}

export const usePrefsStore = create<PrefsState>((set, get) => {
  const initial = load();
  return {
    ...initial,
    favoritesOpen: false,
    toggleReducedMotion: () => {
      const v = !get().reducedMotion;
      set({ reducedMotion: v });
      persist({ ...get(), reducedMotion: v });
    },
    toggleHighContrast: () => {
      const v = !get().highContrast;
      set({ highContrast: v });
      persist({ ...get(), highContrast: v });
    },
    toggleFavorite: (f) => {
      const id = f.properties.id;
      const exists = get().favorites.some((x) => x.properties.id === id);
      const favorites = exists
        ? get().favorites.filter((x) => x.properties.id !== id)
        : [...get().favorites, f];
      set({ favorites });
      persist({ ...get(), favorites });
    },
    isFavorite: (id) => get().favorites.some((x) => x.properties.id === id),
    setFavoritesOpen: (v) => set({ favoritesOpen: v }),
  };
});

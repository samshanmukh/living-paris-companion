import { create } from "zustand";
import type { ParisFeature } from "@/lib/types";

const KEY = "lp.prefs.v1";

interface Persisted {
  reducedMotion: boolean;
  highContrast: boolean;
  favorites: ParisFeature[];
  skyLifeEnabled: boolean;
  ambientSoundEnabled: boolean;
  showDebugControls: boolean;
  visitCount: number;
}

interface PrefsState extends Persisted {
  favoritesOpen: boolean;
  toggleReducedMotion: () => void;
  toggleHighContrast: () => void;
  toggleSkyLife: () => void;
  toggleAmbientSound: () => void;
  toggleDebugControls: () => void;
  recordVisit: () => void;
  toggleFavorite: (f: ParisFeature) => void;
  isFavorite: (id: string) => boolean;
  setFavoritesOpen: (v: boolean) => void;
}

function load(): Persisted {
  if (typeof window === "undefined") {
    return {
      reducedMotion: false,
      highContrast: false,
      favorites: [],
      skyLifeEnabled: true,
      ambientSoundEnabled: false,
      showDebugControls: false,
      visitCount: 0,
    };
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) throw new Error();
    const p = JSON.parse(raw) as Partial<Persisted>;
    return {
      reducedMotion: !!p.reducedMotion,
      highContrast: !!p.highContrast,
      favorites: Array.isArray(p.favorites) ? p.favorites : [],
      skyLifeEnabled: p.skyLifeEnabled !== false,
      ambientSoundEnabled: !!p.ambientSoundEnabled,
      showDebugControls: !!p.showDebugControls,
      visitCount: typeof p.visitCount === "number" ? p.visitCount : 0,
    };
  } catch {
    return {
      reducedMotion: false,
      highContrast: false,
      favorites: [],
      skyLifeEnabled: true,
      ambientSoundEnabled: false,
      showDebugControls: false,
      visitCount: 0,
    };
  }
}

function persistSlice(s: Persisted) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}

export const usePrefsStore = create<PrefsState>((set, get) => {
  const initial = load();
  const persist = () =>
    persistSlice({
      reducedMotion: get().reducedMotion,
      highContrast: get().highContrast,
      favorites: get().favorites,
      skyLifeEnabled: get().skyLifeEnabled,
      ambientSoundEnabled: get().ambientSoundEnabled,
      showDebugControls: get().showDebugControls,
      visitCount: get().visitCount,
    });

  return {
    ...initial,
    favoritesOpen: false,
    toggleReducedMotion: () => {
      set({ reducedMotion: !get().reducedMotion });
      persist();
    },
    toggleHighContrast: () => {
      set({ highContrast: !get().highContrast });
      persist();
    },
    toggleSkyLife: () => {
      set({ skyLifeEnabled: !get().skyLifeEnabled });
      persist();
    },
    toggleAmbientSound: () => {
      set({ ambientSoundEnabled: !get().ambientSoundEnabled });
      persist();
    },
    toggleDebugControls: () => {
      set({ showDebugControls: !get().showDebugControls });
      persist();
    },
    recordVisit: () => {
      const visitCount = get().visitCount + 1;
      set({ visitCount });
      persist();
    },
    toggleFavorite: (f) => {
      const id = f.properties.id;
      const exists = get().favorites.some((x) => x.properties.id === id);
      const favorites = exists
        ? get().favorites.filter((x) => x.properties.id !== id)
        : [...get().favorites, f];
      set({ favorites });
      persist();
    },
    isFavorite: (id) => get().favorites.some((x) => x.properties.id === id),
    setFavoritesOpen: (v) => set({ favoritesOpen: v }),
  };
});

/** First session = fewer prior visits — used for richer sky life on arrival. */
export function isFirstSession(): boolean {
  return usePrefsStore.getState().visitCount <= 1;
}

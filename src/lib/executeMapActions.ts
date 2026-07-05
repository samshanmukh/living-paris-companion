import { usePrefsStore } from "@/store/usePrefsStore";
import { useSceneStore } from "@/store/useSceneStore";
import { findFeature } from "@/lib/concierge";
import type { MapAction, MapAnnotation, MoodType, ParisFeature, ParisFeatureCollection } from "@/lib/types";
import type { RouteOptions } from "@/store/useCityStore";
import type { MapFocus } from "@/lib/mapCamera";

export type ActionStore = {
  setMapFocus: (focus: MapFocus) => void;
  startRoute: (opts?: RouteOptions) => Promise<void>;
  select: (f: ParisFeature) => void;
  setRainMode: (on: boolean) => Promise<void>;
  setHighlightedIds: (ids: string[]) => void;
  setMapAnnotation: (a: MapAnnotation | null) => void;
  setMoodFromAction: (mood: MoodType) => void;
};

export async function executeMapActions(
  actions: MapAction[],
  geojson: ParisFeatureCollection | null,
  store: ActionStore,
) {
  const relightFirst = actions.filter((a) => a.type === "relight" || a.type === "setAccent");
  const rest = actions.filter((a) => a.type !== "relight" && a.type !== "setAccent");

  for (const action of relightFirst) {
    await runAction(action, geojson, store);
  }
  for (const action of rest) {
    await runAction(action, geojson, store);
  }
}

async function runAction(
  action: MapAction,
  geojson: ParisFeatureCollection | null,
  store: ActionStore,
) {
  const scene = useSceneStore.getState();

  switch (action.type) {
    case "relight": {
      if (action.hour != null) scene.setHour(action.hour);
      else if (action.lightPreset === "night") scene.setHour(23);
      else if (action.lightPreset === "dusk") scene.setHour(19);
      else if (action.lightPreset === "dawn") scene.setHour(6);
      else if (action.lightPreset === "day") scene.setHour(12);
      if (action.rain === true) await store.setRainMode(true);
      else if (action.rain === false) await store.setRainMode(false);
      break;
    }
    case "setAccent": {
      if (action.mood) store.setMoodFromAction(action.mood);
      break;
    }
    case "flyTo": {
      if (action.lon == null || action.lat == null) break;
      store.setMapFocus({ kind: "place", lon: action.lon, lat: action.lat });
      break;
    }
    case "highlight": {
      const f = findFeature(geojson, action.placeId, action.placeName);
      if (f) {
        store.setHighlightedIds([f.properties.id]);
        store.select(f);
      } else if (action.placeId) {
        store.setHighlightedIds([action.placeId]);
      }
      break;
    }
    case "route": {
      await store.startRoute({ announce: false, preview: true });
      break;
    }
    case "save": {
      const f = findFeature(geojson, action.placeId, action.placeName);
      if (f) {
        const prefs = usePrefsStore.getState();
        if (!prefs.isFavorite(f.properties.id)) prefs.toggleFavorite(f);
      }
      break;
    }
    case "annotate": {
      if (action.lon == null || action.lat == null || !action.text) break;
      store.setMapAnnotation({ lon: action.lon, lat: action.lat, text: action.text });
      store.setMapFocus({ kind: "place", lon: action.lon, lat: action.lat });
      break;
    }
  }
}

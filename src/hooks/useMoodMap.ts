import { useEffect, useRef } from "react";
import type { MapRef } from "react-map-gl/mapbox";
import { useCityStore } from "@/store/useCityStore";
import { useSceneStore } from "@/store/useSceneStore";
import { moodMapProfile } from "@/lib/moodMap";

/** Animate basemap atmosphere + camera tilt when mood shifts. */
export function useMoodMap(mapRef: React.RefObject<MapRef | null>, mapReady: boolean, reduced: boolean) {
  const mood = useCityStore((s) => s.mood);
  const rainMode = useCityStore((s) => s.rainMode);
  const hourOverride = useSceneStore((s) => s.hourOverride);
  const prevMood = useRef(mood);

  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current?.getMap();
    if (!map) return;

    const profile = moodMapProfile(mood);
    const moodChanged = prevMood.current !== mood;
    prevMood.current = mood;

    try {
      if (hourOverride == null && !rainMode) {
        map.setConfigProperty("basemap", "lightPreset", profile.lightPreset);
        map.setConfigProperty("basemap", "theme", profile.theme);
        map.setConfigProperty("basemap", "showLandmarkIcons", profile.lightPreset !== "night");
      }
    } catch { /* ignore */ }

    if (!rainMode) {
      try {
        map.setFog({
          color: profile.fog.color,
          "high-color": profile.fog.highColor,
          "horizon-blend": profile.fog.horizonBlend,
          "space-color": profile.fog.spaceColor,
          "star-intensity": profile.fog.starIntensity,
        });
      } catch { /* ignore */ }
    }

    if (!moodChanged) return;

    const zoom = map.getZoom();
    if (zoom < 14.5) return;

    try {
      map.easeTo({
        pitch: profile.pitch,
        bearing: profile.bearing,
        duration: reduced ? 280 : 1400,
        essential: true,
      });
    } catch { /* ignore */ }
  }, [mood, mapReady, rainMode, hourOverride, reduced, mapRef]);
}

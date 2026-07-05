import { useEffect } from "react";
import type { MapRef } from "react-map-gl/mapbox";
import { useCityStore } from "@/store/useCityStore";
import { useUIStore } from "@/store/useUIStore";
import { executeMapFocus } from "@/lib/executeMapFocus";
import {
  MAP_PADDING,
  PLACE_BEARING,
  PLACE_ZOOM,
} from "@/lib/mapCamera";
import { moodMapProfile } from "@/lib/moodMap";

/** Drives map camera from selection + route navigation. */
export function useMapCamera(mapRef: React.RefObject<MapRef | null>, mapReady: boolean, reduced: boolean) {
  const selected = useCityStore((s) => s.selected);
  const selectionTick = useCityStore((s) => s.selectionTick);
  const mapFocus = useCityStore((s) => s.mapFocus);
  const mapFocusTick = useCityStore((s) => s.mapFocusTick);
  const mood = useCityStore((s) => s.mood);
  const routePreviewPlaying = useCityStore((s) => s.routePreviewPlaying);

  const moodCam = moodMapProfile(mood);

  useEffect(() => {
    if (!mapReady || !selected) return;
    if (useCityStore.getState().routePreviewPlaying) return;

    const [lon, lat] = selected.geometry.coordinates as [number, number];
    const map = mapRef.current?.getMap();
    if (!map) return;

    const duration = reduced ? 300 : 1800;
    window.requestAnimationFrame(() => {
      if (useCityStore.getState().routePreviewPlaying) return;
      try {
        map.stop();
        map.flyTo({
          center: [lon, lat],
          zoom: PLACE_ZOOM + moodCam.zoomOffset,
          pitch: moodCam.pitch,
          bearing: moodCam.bearing ?? PLACE_BEARING,
          padding: MAP_PADDING,
          duration,
          curve: 1.45,
          speed: 0.82,
          essential: true,
        });
      } catch { /* ignore */ }
    });
  }, [selected, selectionTick, mapReady, reduced, mapRef, moodCam, routePreviewPlaying]);

  useEffect(() => {
    if (!mapReady || !mapFocus) return;

    const map = mapRef.current?.getMap();
    if (!map) return;

    window.requestAnimationFrame(() => {
      if (useCityStore.getState().routePreviewPlaying) return;

      const state = useCityStore.getState();
      const ui = useUIStore.getState();
      executeMapFocus(map, mapFocus, {
        route: state.route,
        routeWaypoints: state.routeWaypoints,
        moodCam,
        liveZoom: ui.assistantExpanded || ui.assistantFullscreen || state.routePreviewPlaying,
        reduced,
      });
    });
  }, [mapFocus, mapFocusTick, mapReady, reduced, mapRef, moodCam]);
}

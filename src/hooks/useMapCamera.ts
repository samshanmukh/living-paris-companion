import { useEffect } from "react";
import type { MapRef } from "react-map-gl/mapbox";
import { useCityStore } from "@/store/useCityStore";
import { useUIStore } from "@/store/useUIStore";
import {
  LIVE_PLACE_PITCH,
  LIVE_PLACE_ZOOM,
  MAP_PADDING,
  PLACE_BEARING,
  PLACE_ZOOM,
  PLACES_OVERVIEW_MAX_ZOOM,
  bboxFromCoords,
} from "@/lib/mapCamera";
import { moodMapProfile } from "@/lib/moodMap";

/** Drives map camera from selection + route navigation. */
export function useMapCamera(mapRef: React.RefObject<MapRef | null>, mapReady: boolean, reduced: boolean) {
  const selected = useCityStore((s) => s.selected);
  const selectionTick = useCityStore((s) => s.selectionTick);
  const mapFocus = useCityStore((s) => s.mapFocus);
  const mapFocusTick = useCityStore((s) => s.mapFocusTick);
  const route = useCityStore((s) => s.route);
  const routeWaypoints = useCityStore((s) => s.routeWaypoints);
  const mood = useCityStore((s) => s.mood);
  const routePreviewPlaying = useCityStore((s) => s.routePreviewPlaying);

  const moodCam = moodMapProfile(mood);
  const liveZoom = () =>
    useUIStore.getState().assistantExpanded || routePreviewPlaying;

  useEffect(() => {
    if (!mapReady || !selected) return;
    const [lon, lat] = selected.geometry.coordinates as [number, number];
    const map = mapRef.current?.getMap();
    if (!map) return;

    const duration = reduced ? 300 : 1800;
    window.requestAnimationFrame(() => {
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
  }, [selected, selectionTick, mapReady, reduced, mapRef, moodCam]);

  useEffect(() => {
    if (!mapReady || !mapFocus) return;
    const map = mapRef.current?.getMap();
    if (!map) return;

    const duration = reduced ? 280 : 1600;
    const run = () => {
      try {
        map.stop();
        switch (mapFocus.kind) {
          case "place": {
            map.flyTo({
              center: [mapFocus.lon, mapFocus.lat],
              zoom: PLACE_ZOOM + moodCam.zoomOffset,
              pitch: moodCam.pitch,
              bearing: moodCam.bearing,
              padding: MAP_PADDING,
              duration,
              curve: 1.45,
              speed: 0.82,
              essential: true,
            });
            break;
          }
          case "route-stop": {
            const wp = routeWaypoints?.[mapFocus.stopIndex];
            if (!wp) return;
            const live = liveZoom();
            map.flyTo({
              center: [wp.lon, wp.lat],
              zoom: (live ? LIVE_PLACE_ZOOM : mapFocus.stopIndex === 0 ? 17.2 : PLACE_ZOOM) + moodCam.zoomOffset,
              pitch: live ? LIVE_PLACE_PITCH : moodCam.pitch - 4,
              bearing: moodCam.bearing,
              padding: MAP_PADDING,
              duration,
              curve: 1.4,
              speed: 0.85,
              essential: true,
            });
            break;
          }
          case "route-overview": {
            const coords = route?.geometry?.geometry?.coordinates as [number, number][] | undefined;
            if (!coords?.length) return;
            const { minLon, minLat, maxLon, maxLat } = bboxFromCoords(coords);
            map.fitBounds(
              [[minLon, minLat], [maxLon, maxLat]],
              { padding: MAP_PADDING, duration: duration * 0.75, maxZoom: 16.2, pitch: moodCam.pitch - 8 },
            );
            break;
          }
          case "places-overview": {
            if (mapFocus.coords.length < 1) return;
            const { minLon, minLat, maxLon, maxLat } = bboxFromCoords(mapFocus.coords);
            map.fitBounds(
              [[minLon, minLat], [maxLon, maxLat]],
              {
                padding: MAP_PADDING,
                duration: duration * 0.85,
                maxZoom: PLACES_OVERVIEW_MAX_ZOOM,
                pitch: moodCam.pitch - 6,
                bearing: moodCam.bearing,
              },
            );
            break;
          }
        }
      } catch { /* ignore */ }
    };

    window.requestAnimationFrame(run);
  }, [mapFocus, mapFocusTick, mapReady, reduced, route, routeWaypoints, mapRef, moodCam]);
}

import { useEffect, useRef } from "react";
import type { MapRef } from "react-map-gl/mapbox";
import { useCityStore } from "@/store/useCityStore";
import { MAP_PADDING, LIVE_PLACE_PITCH, LIVE_PLACE_ZOOM, bboxFromCoords } from "@/lib/mapCamera";
import { moodMapProfile } from "@/lib/moodMap";
import {
  ROUTE_PREVIEW_FLY_MS,
  ROUTE_PREVIEW_OVERVIEW_MS,
  ROUTE_PREVIEW_PAUSE_MS,
  bearingBetween,
  pause,
  routeProgressToStop,
  waitForMapMoveEnd,
} from "@/lib/routePreview";

/** Cinematic stop-by-stop camera tour after a route is planned. */
export function useRoutePreview(
  mapRef: React.RefObject<MapRef | null>,
  mapReady: boolean,
  reduced: boolean,
) {
  const generation = useCityStore((s) => s.routePreviewGeneration);
  const playing = useCityStore((s) => s.routePreviewPlaying);
  const runningRef = useRef(false);

  useEffect(() => {
    if (!mapReady || !playing) return;
    const map = mapRef.current?.getMap();
    const route = useCityStore.getState().route;
    const waypoints = useCityStore.getState().routeWaypoints;
    if (!map || !route?.geometry || !waypoints?.length) return;

    const coords = route.geometry.geometry.coordinates as [number, number][];
    const gen = generation;
    runningRef.current = true;

    const flyMs = reduced ? 420 : ROUTE_PREVIEW_FLY_MS;
    const pauseMs = reduced ? 900 : ROUTE_PREVIEW_PAUSE_MS;

    void (async () => {
      try {
        map.stop();

        for (let i = 0; i < waypoints.length; i++) {
          if (!useCityStore.getState().routePreviewPlaying) break;
          if (useCityStore.getState().routePreviewGeneration !== gen) break;

          const wp = waypoints[i];
          const prev = i > 0 ? waypoints[i - 1] : null;
          const bearing = prev ? bearingBetween(prev, wp) - 90 : -10;
          const progress = routeProgressToStop(coords, waypoints, i);

          useCityStore.setState({
            activeRouteStop: i,
            routePreviewStop: i,
            routePreviewProgress: progress,
          });

          const profile = moodMapProfile(useCityStore.getState().mood);

          map.flyTo({
            center: [wp.lon, wp.lat],
            zoom: LIVE_PLACE_ZOOM + profile.zoomOffset,
            pitch: LIVE_PLACE_PITCH,
            bearing,
            padding: MAP_PADDING,
            duration: flyMs,
            curve: 1.35,
            speed: 0.78,
            essential: true,
          });

          await waitForMapMoveEnd(map, flyMs + 400);
          if (!useCityStore.getState().routePreviewPlaying) break;
          if (useCityStore.getState().routePreviewGeneration !== gen) break;
          await pause(pauseMs);
        }

        if (
          useCityStore.getState().routePreviewPlaying &&
          useCityStore.getState().routePreviewGeneration === gen
        ) {
          const { minLon, minLat, maxLon, maxLat } = bboxFromCoords(coords);
          map.fitBounds(
            [[minLon, minLat], [maxLon, maxLat]],
            {
              padding: MAP_PADDING,
              duration: reduced ? 400 : ROUTE_PREVIEW_OVERVIEW_MS,
              maxZoom: 15.4,
              pitch: 52,
              bearing: -8,
            },
          );
          await waitForMapMoveEnd(map, ROUTE_PREVIEW_OVERVIEW_MS + 300);
          useCityStore.setState({
            routePreviewProgress: 1,
            activeRouteStop: 0,
          });
        }
      } finally {
        runningRef.current = false;
        if (useCityStore.getState().routePreviewGeneration === gen) {
          useCityStore.getState().finishRoutePreview();
        }
      }
    })();

    return () => {
      runningRef.current = false;
    };
  }, [mapReady, playing, generation, reduced, mapRef]);
}

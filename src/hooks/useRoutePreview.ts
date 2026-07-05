import { useEffect } from "react";
import type { Map } from "mapbox-gl";
import type { MapRef } from "react-map-gl/mapbox";
import { useCityStore } from "@/store/useCityStore";
import type { RouteWaypoint } from "@/lib/types";
import { getRegisteredMap } from "@/lib/mapController";
import { MAP_PADDING, LIVE_PLACE_PITCH, LIVE_PLACE_ZOOM, bboxFromCoords } from "@/lib/mapCamera";
import { moodMapProfile } from "@/lib/moodMap";
import {
  ROUTE_PREVIEW_FLY_MS,
  ROUTE_PREVIEW_OVERVIEW_MS,
  ROUTE_PREVIEW_PAUSE_MS,
  bearingBetween,
  pause,
  routeProgressToStop,
  waitForCameraFlight,
} from "@/lib/routePreview";

function resolveMap(mapRef: React.RefObject<MapRef | null>): Map | null | undefined {
  return mapRef.current?.getMap() ?? getRegisteredMap();
}

/** Cinematic stop-by-stop camera tour after a route is planned. */
export function useRoutePreview(
  mapRef: React.RefObject<MapRef | null>,
  mapReady: boolean,
  reduced: boolean,
) {
  const generation = useCityStore((s) => s.routePreviewGeneration);
  const playing = useCityStore((s) => s.routePreviewPlaying);

  useEffect(() => {
    if (!mapReady || !playing) return;

    let cancelled = false;
    const gen = generation;
    const flyMs = reduced ? 420 : ROUTE_PREVIEW_FLY_MS;
    const pauseMs = reduced ? 900 : ROUTE_PREVIEW_PAUSE_MS;
    const overviewMs = reduced ? 400 : ROUTE_PREVIEW_OVERVIEW_MS;

    const map = resolveMap(mapRef);
    const route = useCityStore.getState().route;
    const waypoints = useCityStore.getState().routeWaypoints;
    if (!map || !route?.geometry?.geometry || !waypoints?.length) return;

    const coords = route.geometry.geometry.coordinates as [number, number][];

    void (async () => {
      try {
        map.stop();

        for (let i = 0; i < waypoints.length; i++) {
          if (cancelled) break;
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

          await waitForCameraFlight(map, flyMs);
          if (!useCityStore.getState().routePreviewPlaying) break;
          if (useCityStore.getState().routePreviewGeneration !== gen) break;
          if (i < waypoints.length - 1) await pause(pauseMs);
        }

        if (
          !cancelled &&
          useCityStore.getState().routePreviewPlaying &&
          useCityStore.getState().routePreviewGeneration === gen
        ) {
          const { minLon, minLat, maxLon, maxLat } = bboxFromCoords(coords);
          map.fitBounds(
            [[minLon, minLat], [maxLon, maxLat]],
            {
              padding: MAP_PADDING,
              duration: overviewMs,
              maxZoom: 15.4,
              pitch: 52,
              bearing: -8,
            },
          );
          await waitForCameraFlight(map, overviewMs);
          useCityStore.setState({
            routePreviewProgress: 1,
            activeRouteStop: 0,
          });
        }
      } finally {
        if (!cancelled && useCityStore.getState().routePreviewGeneration === gen) {
          useCityStore.getState().finishRoutePreview();
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mapReady, playing, generation, reduced, mapRef]);
}

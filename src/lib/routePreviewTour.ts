import type { Map } from "mapbox-gl";
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
import type { MoodType, RouteResponse, RouteWaypoint } from "@/lib/types";

type TourStore = {
  routePreviewPlaying: boolean;
  routePreviewGeneration: number;
  mood: MoodType;
};

type TourStoreApi = {
  getState: () => TourStore;
  setState: (partial: {
    activeRouteStop?: number;
    routePreviewStop?: number;
    routePreviewProgress?: number;
  }) => void;
  finishRoutePreview: () => void;
};

/** Stop-by-stop camera walkthrough — called directly when a route is planned. */
export async function startRoutePreviewTour(
  route: RouteResponse,
  waypoints: RouteWaypoint[],
  generation: number,
  reduced: boolean,
  store: TourStoreApi,
) {
  const map: Map | null | undefined = getRegisteredMap();
  const line = route.geometry?.geometry;
  if (!map || !line?.coordinates?.length || !waypoints.length) return;

  const coords = line.coordinates as [number, number][];
  const flyMs = reduced ? 420 : ROUTE_PREVIEW_FLY_MS;
  const pauseMs = reduced ? 900 : ROUTE_PREVIEW_PAUSE_MS;
  const overviewMs = reduced ? 400 : ROUTE_PREVIEW_OVERVIEW_MS;

  try {
    map.stop();

    for (let i = 0; i < waypoints.length; i++) {
      const state = store.getState();
      if (!state.routePreviewPlaying || state.routePreviewGeneration !== generation) break;

      const wp = waypoints[i];
      const prev = i > 0 ? waypoints[i - 1] : null;
      const bearing = prev ? bearingBetween(prev, wp) - 90 : -10;
      const progress = routeProgressToStop(coords, waypoints, i);
      const profile = moodMapProfile(state.mood);

      store.setState({
        activeRouteStop: i,
        routePreviewStop: i,
        routePreviewProgress: progress,
      });

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

      if (!store.getState().routePreviewPlaying) break;
      if (store.getState().routePreviewGeneration !== generation) break;
      if (i < waypoints.length - 1) await pause(pauseMs);
    }

    if (
      store.getState().routePreviewPlaying &&
      store.getState().routePreviewGeneration === generation
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
      store.setState({ routePreviewProgress: 1, activeRouteStop: 0 });
    }
  } finally {
    if (store.getState().routePreviewGeneration === generation) {
      store.finishRoutePreview();
    }
  }
}

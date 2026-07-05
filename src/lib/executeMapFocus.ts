import type { Map } from "mapbox-gl";
import type { RouteResponse, RouteWaypoint } from "./types";
import {
  LIVE_PLACE_PITCH,
  LIVE_PLACE_ZOOM,
  MAP_PADDING,
  PLACE_BEARING,
  PLACE_ZOOM,
  PLACES_OVERVIEW_MAX_ZOOM,
  bboxFromCoords,
  type MapFocus,
} from "./mapCamera";
import type { MoodMapProfile } from "./moodMap";

export type MapFocusContext = {
  route?: RouteResponse | null;
  routeWaypoints?: RouteWaypoint[] | null;
  moodCam: MoodMapProfile;
  liveZoom: boolean;
  reduced: boolean;
};

/** Imperatively move the Mapbox camera for a focus target. */
export function executeMapFocus(map: Map, focus: MapFocus, ctx: MapFocusContext) {
  const duration = ctx.reduced ? 280 : 1600;

  try {
    map.stop();
    switch (focus.kind) {
      case "place": {
        map.flyTo({
          center: [focus.lon, focus.lat],
          zoom: PLACE_ZOOM + ctx.moodCam.zoomOffset,
          pitch: ctx.moodCam.pitch,
          bearing: ctx.moodCam.bearing ?? PLACE_BEARING,
          padding: MAP_PADDING,
          duration,
          curve: 1.45,
          speed: 0.82,
          essential: true,
        });
        break;
      }
      case "route-stop": {
        const wp = ctx.routeWaypoints?.[focus.stopIndex];
        if (!wp) return;
        map.flyTo({
          center: [wp.lon, wp.lat],
          zoom:
            (ctx.liveZoom
              ? LIVE_PLACE_ZOOM
              : focus.stopIndex === 0
                ? 17.2
                : PLACE_ZOOM) + ctx.moodCam.zoomOffset,
          pitch: ctx.liveZoom ? LIVE_PLACE_PITCH : ctx.moodCam.pitch - 4,
          bearing: ctx.moodCam.bearing,
          padding: MAP_PADDING,
          duration,
          curve: 1.4,
          speed: 0.85,
          essential: true,
        });
        break;
      }
      case "route-overview": {
        const coords = ctx.route?.geometry?.geometry?.coordinates as [number, number][] | undefined;
        if (!coords?.length) return;
        const { minLon, minLat, maxLon, maxLat } = bboxFromCoords(coords);
        map.fitBounds(
          [[minLon, minLat], [maxLon, maxLat]],
          {
            padding: MAP_PADDING,
            duration: duration * 0.75,
            maxZoom: 16.2,
            pitch: ctx.moodCam.pitch - 8,
          },
        );
        break;
      }
      case "places-overview": {
        if (focus.coords.length < 1) return;
        const { minLon, minLat, maxLon, maxLat } = bboxFromCoords(focus.coords);
        map.fitBounds(
          [[minLon, minLat], [maxLon, maxLat]],
          {
            padding: MAP_PADDING,
            duration: duration * 1.05,
            maxZoom: PLACES_OVERVIEW_MAX_ZOOM,
            pitch: ctx.moodCam.pitch - 6,
            bearing: ctx.moodCam.bearing,
          },
        );
        break;
      }
    }
  } catch {
    /* ignore map errors during style transitions */
  }
}

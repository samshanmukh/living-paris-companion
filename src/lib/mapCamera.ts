import type { RouteWaypoint } from "./types";

export const MAP_PADDING = { top: 88, bottom: 300, left: 48, right: 48 };

export type MapFocus =
  | { kind: "place"; lon: number; lat: number }
  | { kind: "route-overview" }
  | { kind: "route-stop"; stopIndex: number }
  | { kind: "places-overview"; coords: [number, number][] };

export function bboxFromCoords(coords: [number, number][]) {
  let minLon = Infinity, minLat = Infinity, maxLon = -Infinity, maxLat = -Infinity;
  for (const [lon, lat] of coords) {
    if (lon < minLon) minLon = lon;
    if (lat < minLat) minLat = lat;
    if (lon > maxLon) maxLon = lon;
    if (lat > maxLat) maxLat = lat;
  }
  return { minLon, minLat, maxLon, maxLat };
}

export function nearestCoordIndex(route: [number, number][], lon: number, lat: number): number {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < route.length; i++) {
    const d = (route[i][0] - lon) ** 2 + (route[i][1] - lat) ** 2;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

/** Split route line into completed / active / upcoming segments by stop index. */
export function splitRouteByStop(
  coords: [number, number][],
  waypoints: RouteWaypoint[],
  activeStopIndex: number,
): { completed: [number, number][]; active: [number, number][]; upcoming: [number, number][] } {
  if (coords.length < 2 || waypoints.length < 2 || activeStopIndex < 1) {
    return { completed: [], active: coords, upcoming: [] };
  }

  const fromIdx = nearestCoordIndex(coords, waypoints[activeStopIndex - 1].lon, waypoints[activeStopIndex - 1].lat);
  const toIdx = nearestCoordIndex(coords, waypoints[activeStopIndex].lon, waypoints[activeStopIndex].lat);
  const start = Math.min(fromIdx, toIdx);
  const end = Math.max(fromIdx, toIdx);

  return {
    completed: coords.slice(0, start + 1),
    active: coords.slice(start, end + 1),
    upcoming: coords.slice(end),
  };
}

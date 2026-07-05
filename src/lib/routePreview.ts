import { nearestCoordIndex } from "@/lib/mapCamera";
import type { ParisFeature, RouteWaypoint } from "@/lib/types";

export const ROUTE_PREVIEW_PAUSE_MS = 2400;
export const ROUTE_PREVIEW_FLY_MS = 2600;
export const ROUTE_PREVIEW_OVERVIEW_MS = 1800;

export function waypointsFromFeatures(stops: ParisFeature[]): RouteWaypoint[] {
  return stops.map((s) => {
    const [lon, lat] = s.geometry.coordinates as [number, number];
    return { lon, lat, name: s.properties.name, id: s.properties.id };
  });
}

export function isUserStartWaypoint(wp: RouteWaypoint): boolean {
  const n = (wp.name ?? "").toLowerCase();
  return n === "start" || n.startsWith("you ·") || n.startsWith("you ");
}

export function isPlaceOnlyRoute(waypoints: RouteWaypoint[]): boolean {
  return waypoints.length > 0 && !isUserStartWaypoint(waypoints[0]);
}

/** Fraction along the route polyline (0–1) at a stop index. */
export function routeProgressToStop(
  coords: [number, number][],
  waypoints: RouteWaypoint[],
  stopIndex: number,
): number {
  if (coords.length < 2 || !waypoints.length) return 1;
  if (stopIndex <= 0) return 0;

  let totalLen = 0;
  const segLens: number[] = [];
  for (let i = 1; i < coords.length; i++) {
    const d = Math.hypot(coords[i][0] - coords[i - 1][0], coords[i][1] - coords[i - 1][1]);
    segLens.push(d);
    totalLen += d;
  }
  if (totalLen === 0) return 1;

  const idx = Math.min(stopIndex, waypoints.length - 1);
  const target = waypoints[idx];
  const coordIdx = nearestCoordIndex(coords, target.lon, target.lat);
  let acc = 0;
  for (let i = 1; i <= coordIdx && i < coords.length; i++) {
    acc += segLens[i - 1] ?? 0;
  }
  return Math.min(1, Math.max(0, acc / totalLen));
}

export function bearingBetween(from: RouteWaypoint, to: RouteWaypoint): number {
  const dLon = ((to.lon - from.lon) * Math.PI) / 180;
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function pause(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function waitForMapMoveEnd(
  map: { once: (e: string, fn: () => void) => void; off: (e: string, fn: () => void) => void },
  timeoutMs = 8000,
): Promise<void> {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      map.off("moveend", finish);
      window.clearTimeout(timer);
      resolve();
    };
    const timer = window.setTimeout(finish, timeoutMs);
    map.once("moveend", finish);
  });
}

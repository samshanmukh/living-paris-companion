import type { Map as MapboxMap } from "mapbox-gl";

/** Mapbox throws if style internals aren't ready — never call getLayer raw. */
export function safeGetLayer(map: MapboxMap | null | undefined, id: string): boolean {
  if (!map) return false;
  try {
    if (!map.isStyleLoaded()) return false;
    return Boolean(map.getLayer(id));
  } catch {
    return false;
  }
}

export function safeRemoveLayer(map: MapboxMap | null | undefined, id: string) {
  if (!safeGetLayer(map, id)) return;
  try {
    map!.removeLayer(id);
  } catch {
    /* ignore */
  }
}

export function safeProject(
  map: MapboxMap,
  coord: [number, number],
): { x: number; y: number } | null {
  try {
    const p = map.project(coord);
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return null;
    return { x: p.x, y: p.y };
  } catch {
    return null;
  }
}

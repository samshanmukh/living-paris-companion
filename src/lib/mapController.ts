import type { Map } from "mapbox-gl";
import { executeMapFocus, type MapFocusContext } from "./executeMapFocus";
import type { MapFocus } from "./mapCamera";

type MapGetter = () => Map | null | undefined;

let getLiveMap: MapGetter | null = null;

export function registerLiveMap(getter: MapGetter) {
  getLiveMap = getter;
  return () => {
    if (getLiveMap === getter) getLiveMap = null;
  };
}

export function getRegisteredMap() {
  return getLiveMap?.() ?? null;
}

/** Move the map immediately — does not depend on React effects. */
export function applyMapFocus(focus: MapFocus, ctx: MapFocusContext): boolean {
  const map = getLiveMap?.();
  if (!map) return false;
  executeMapFocus(map, focus, ctx);
  return true;
}

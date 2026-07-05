import { useEffect, useRef } from "react";
import { useMap } from "react-map-gl/mapbox";
import type { Map as MapboxMap } from "mapbox-gl";
import { computeParisSunPosition, sunVisualForPreset } from "@/lib/parisSun";
import { resolveLightPreset } from "@/lib/parisWeather";
import { useSceneStore } from "@/store/useSceneStore";

/** Time-accurate directional lighting on Mapbox Standard (no custom sky layer). */
function applySunToMap(map: MapboxMap, hourOverride: number | null) {
  if (!map.isStyleLoaded()) return;

  try {
    const parisConditions = useSceneStore.getState().parisConditions;
    const preset = resolveLightPreset(parisConditions, hourOverride);
    const sun = computeParisSunPosition(hourOverride);
    const visual = sunVisualForPreset(preset, sun);

    map.setLights([
      {
        id: "lp-ambient",
        type: "ambient",
        properties: {
          color: "rgb(255, 255, 255)",
          intensity: visual.ambientIntensity,
        },
      },
      {
        id: "lp-sun",
        type: "directional",
        properties: {
          direction: [sun.azimuth, sun.polar],
          color: visual.lightColor,
          intensity: visual.lightIntensity,
          "cast-shadows": visual.castShadows,
          "shadow-intensity": 0.28,
        },
      },
    ]);
  } catch {
    /* Mapbox Standard may reject lights until fully ready */
  }
}

export function MapSunLayer() {
  const { current: mapRef } = useMap();
  const hourOverride = useSceneStore((s) => s.hourOverride);
  const parisConditions = useSceneStore((s) => s.parisConditions);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map) return;

    const scheduleSync = () => applySunToMap(map, hourOverride);

    map.on("load", scheduleSync);
    map.on("styledata", scheduleSync);

    if (map.isStyleLoaded()) scheduleSync();

    intervalRef.current = window.setInterval(() => {
      if (map.isStyleLoaded()) scheduleSync();
    }, 30_000);

    return () => {
      map.off("load", scheduleSync);
      map.off("styledata", scheduleSync);
      if (intervalRef.current != null) window.clearInterval(intervalRef.current);
    };
  }, [mapRef, hourOverride, parisConditions]);

  return null;
}

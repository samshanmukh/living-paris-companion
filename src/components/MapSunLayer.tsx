import { useEffect, useRef } from "react";
import { useMap } from "react-map-gl/mapbox";
import type { Map as MapboxMap } from "mapbox-gl";
import { computeParisSunPosition, sunVisualForPreset } from "@/lib/parisSun";
import { resolveLightPreset } from "@/lib/parisWeather";
import { useSceneStore } from "@/store/useSceneStore";

const SKY_LAYER_ID = "lp-atmosphere-sky";

function skyOpacityForPitch(pitch: number): number {
  if (pitch < 35) return 0;
  if (pitch < 55) return 0.35 + ((pitch - 35) / 20) * 0.57;
  if (pitch < 85) return 0.92 + ((pitch - 55) / 30) * 0.08;
  return 1;
}

function findSkyLayerId(map: MapboxMap): string | null {
  if (!map.isStyleLoaded()) return null;
  try {
    const layers = map.getStyle()?.layers;
    if (!layers) return null;
    const existing = layers.find((layer) => layer.type === "sky");
    return existing?.id ?? null;
  } catch {
    return null;
  }
}

function ensureSkyLayer(map: MapboxMap): string | null {
  if (!map.isStyleLoaded()) return null;

  const existing = findSkyLayerId(map);
  if (existing) return existing;

  try {
    if (map.getLayer(SKY_LAYER_ID)) return SKY_LAYER_ID;

    map.addLayer({
      id: SKY_LAYER_ID,
      type: "sky",
      paint: {
        "sky-type": "atmosphere",
        "sky-opacity": skyOpacityForPitch(map.getPitch()),
      },
    });

    return map.getLayer(SKY_LAYER_ID) ? SKY_LAYER_ID : null;
  } catch {
    return null;
  }
}

function applySunToMap(map: MapboxMap, hourOverride: number | null) {
  if (!map.isStyleLoaded()) return;

  try {
    const parisConditions = useSceneStore.getState().parisConditions;
    const preset = resolveLightPreset(parisConditions, hourOverride);
    const sun = computeParisSunPosition(hourOverride);
    const visual = sunVisualForPreset(preset, sun);

    const layerId = ensureSkyLayer(map);
    if (layerId && map.getLayer(layerId)) {
      map.setPaintProperty(layerId, "sky-opacity", skyOpacityForPitch(map.getPitch()));
      map.setPaintProperty(layerId, "sky-type", "atmosphere");
      map.setPaintProperty(layerId, "sky-atmosphere-sun", [sun.azimuth, sun.polar]);
      map.setPaintProperty(layerId, "sky-atmosphere-sun-intensity", visual.sunIntensity);
      map.setPaintProperty(layerId, "sky-atmosphere-halo-color", visual.haloColor);
      map.setPaintProperty(layerId, "sky-atmosphere-color", visual.skyTint);
    }

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
    /* map style still initializing */
  }
}

/** Renders a time-accurate 3D sun in the Mapbox sky + casts building shadows. */
export function MapSunLayer() {
  const { current: mapRef } = useMap();
  const hourOverride = useSceneStore((s) => s.hourOverride);
  const parisConditions = useSceneStore((s) => s.parisConditions);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map) return;

    const scheduleSync = () => applySunToMap(map, hourOverride);

    scheduleSync();
    map.on("load", scheduleSync);
    map.on("styledata", scheduleSync);
    map.on("pitch", scheduleSync);

    intervalRef.current = window.setInterval(scheduleSync, 30_000);

    return () => {
      map.off("load", scheduleSync);
      map.off("styledata", scheduleSync);
      map.off("pitch", scheduleSync);
      if (intervalRef.current != null) window.clearInterval(intervalRef.current);
    };
  }, [mapRef, hourOverride, parisConditions]);

  return null;
}

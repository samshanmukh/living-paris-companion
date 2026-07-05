import { useEffect, useRef } from "react";
import { useMap } from "react-map-gl/mapbox";
import { BIRDS_LAYER_ID, createParisBirdsLayer } from "@/lib/parisBirdLayer";
import { birdCountForPreset, birdsVisible } from "@/lib/parisBirds";
import { resolveLightPreset } from "@/lib/parisWeather";
import { usePrefsStore } from "@/store/usePrefsStore";
import { useSceneStore } from "@/store/useSceneStore";

/** Ambient 3D birds circling above Paris — visible at high pitch, dawn through dusk. */
export function MapBirdsLayer() {
  const { current: mapRef } = useMap();
  const hourOverride = useSceneStore((s) => s.hourOverride);
  const parisConditions = useSceneStore((s) => s.parisConditions);
  const reduced = usePrefsStore((s) => s.reducedMotion);
  const layerRef = useRef<ReturnType<typeof createParisBirdsLayer> | null>(null);
  const ctxRef = useRef({
    hourOverride: null as number | null,
    parisConditions: null as ReturnType<typeof useSceneStore.getState>["parisConditions"],
    reduced: false,
  });

  ctxRef.current = { hourOverride, parisConditions, reduced };

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map) return;

    const getPreset = () =>
      resolveLightPreset(ctxRef.current.parisConditions, ctxRef.current.hourOverride);

    const getBirdCount = () => {
      if (ctxRef.current.reduced) return 0;
      const preset = getPreset();
      if (
        !birdsVisible({
          preset,
          pitch: map.getPitch(),
          reducedMotion: ctxRef.current.reduced,
        })
      ) {
        return 0;
      }
      return birdCountForPreset(preset);
    };

    const layer =
      layerRef.current ??
      createParisBirdsLayer({
        getPreset,
        getBirdCount,
      });
    layerRef.current = layer;

    const mount = () => {
      if (!map.getLayer(BIRDS_LAYER_ID)) {
        try {
          map.addLayer(layer);
        } catch {
          /* style not ready */
        }
      }
    };

    const schedule = () => {
      if (map.isStyleLoaded()) mount();
    };

    schedule();
    map.on("load", schedule);
    map.on("styledata", schedule);
    map.on("pitch", schedule);
    map.on("moveend", schedule);

    return () => {
      map.off("load", schedule);
      map.off("styledata", schedule);
      map.off("pitch", schedule);
      map.off("moveend", schedule);
      if (map.getLayer(BIRDS_LAYER_ID)) {
        try {
          map.removeLayer(BIRDS_LAYER_ID);
        } catch {
          /* ignore */
        }
      }
    };
  }, [mapRef]);

  return null;
}

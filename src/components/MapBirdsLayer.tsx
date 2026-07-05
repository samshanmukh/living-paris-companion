import { Component, type ReactNode, useEffect, useRef } from "react";
import { useMap } from "react-map-gl/mapbox";
import { BIRDS_LAYER_ID, createParisBirdsLayer } from "@/lib/parisBirdLayer";
import { birdCountForPreset, birdsVisible } from "@/lib/parisBirds";
import { resolveLightPreset } from "@/lib/parisWeather";
import { usePrefsStore } from "@/store/usePrefsStore";
import { useSceneStore } from "@/store/useSceneStore";

class BirdsErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function MapBirdsLayerInner() {
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
      if (!map.isStyleLoaded()) return 0;
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
      if (!map.isStyleLoaded()) return;
      if (map.getLayer(BIRDS_LAYER_ID)) return;
      try {
        map.addLayer(layer);
      } catch {
        /* style not ready or WebGL unavailable */
      }
    };

    const schedule = () => mount();

    map.on("load", schedule);
    map.on("styledata", schedule);
    map.on("pitch", schedule);

    const delayId = window.setTimeout(schedule, 1200);

    return () => {
      window.clearTimeout(delayId);
      map.off("load", schedule);
      map.off("styledata", schedule);
      map.off("pitch", schedule);
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

/** Ambient 3D birds — isolated so WebGL failures cannot crash the app. */
export function MapBirdsLayer() {
  return (
    <BirdsErrorBoundary>
      <MapBirdsLayerInner />
    </BirdsErrorBoundary>
  );
}

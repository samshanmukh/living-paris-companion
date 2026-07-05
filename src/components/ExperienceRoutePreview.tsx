import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useMap } from "react-map-gl/mapbox";
import { useCityStore } from "@/store/useCityStore";
import { buildItineraries } from "@/lib/itinerary";
import { safeProject } from "@/lib/mapSafe";

const CORE = "#C77E6A";

/** Dotted preview line for the active experience card (before Live this one). */
export function ExperienceRoutePreview() {
  const geojson = useCityStore((s) => s.geojson);
  const center = useCityStore((s) => s.center);
  const mood = useCityStore((s) => s.mood);
  const rainMode = useCityStore((s) => s.rainMode);
  const route = useCityStore((s) => s.route);
  const routePreviewPlaying = useCityStore((s) => s.routePreviewPlaying);
  const activeExperienceIndex = useCityStore((s) => s.activeExperienceIndex);
  const { current: mapRef } = useMap();
  const [points, setPoints] = useState("");
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  const stops = useMemo(() => {
    if (!geojson?.features.length || route || routePreviewPlaying) return [];
    const plans = buildItineraries(geojson.features, center, { mood, rainMode });
    return plans[activeExperienceIndex]?.stops ?? [];
  }, [geojson, center, mood, rainMode, route, routePreviewPlaying, activeExperienceIndex]);

  useEffect(() => {
    if (!mapRef) return;
    setPortalTarget(mapRef.getMap().getContainer());
  }, [mapRef]);

  useEffect(() => {
    if (!mapRef || stops.length < 2) {
      setPoints("");
      return;
    }

    const map = mapRef.getMap();
    let frame = 0;
    let cancelled = false;

    const project = () => {
      if (cancelled) return;
      const projected = stops
        .map((s) => safeProject(map, s.geometry.coordinates as [number, number]))
        .filter((p): p is { x: number; y: number } => p !== null)
        .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`);
      setPoints(projected.length >= 2 ? projected.join(" ") : "");
    };

    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        project();
      });
    };

    project();
    map.on("render", schedule);
    map.on("move", schedule);
    map.on("resize", schedule);

    return () => {
      cancelled = true;
      if (frame) cancelAnimationFrame(frame);
      map.off("render", schedule);
      map.off("move", schedule);
      map.off("resize", schedule);
    };
  }, [mapRef, stops]);

  if (!points || !portalTarget || stops.length < 2) return null;

  return createPortal(
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-visible"
      style={{ zIndex: 1 }}
      width="100%"
      height="100%"
    >
      <polyline
        points={points}
        fill="none"
        stroke={CORE}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.45"
        strokeDasharray="4 7"
      />
    </svg>,
    portalTarget,
  );
}

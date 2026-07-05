import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useMap } from "react-map-gl/mapbox";
import { useCityStore } from "@/store/useCityStore";
import { safeProject } from "@/lib/mapSafe";

const CORE = "#C77E6A";

function trimPoints(points: string, progress: number): string {
  if (progress >= 1) return points;
  const pairs = points.trim().split(/\s+/);
  const keep = Math.max(2, Math.ceil(pairs.length * progress));
  return pairs.slice(0, keep).join(" ");
}

function isValidPointsString(points: string): boolean {
  if (!points.trim()) return false;
  return points.trim().split(/\s+/).every((pair) => {
    const [x, y] = pair.split(",");
    const nx = Number(x);
    const ny = Number(y);
    return Number.isFinite(nx) && Number.isFinite(ny);
  });
}

/** Subtle dotted draw animation during route preview only — sits under markers. */
export function RoutePreviewOverlay() {
  const route = useCityStore((s) => s.route);
  const progress = useCityStore((s) => s.routePreviewProgress);
  const playing = useCityStore((s) => s.routePreviewPlaying);
  const { current: mapRef } = useMap();
  const [points, setPoints] = useState("");
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  const coords = useMemo(
    () => (route?.geometry?.geometry?.coordinates as [number, number][] | undefined) ?? [],
    [route],
  );

  useEffect(() => {
    if (!mapRef) return;
    setPortalTarget(mapRef.getMap().getContainer());
  }, [mapRef]);

  useEffect(() => {
    if (!playing || !mapRef || coords.length < 2) {
      setPoints("");
      return;
    }

    const map = mapRef.getMap();
    let frame = 0;
    let cancelled = false;

    const project = () => {
      if (cancelled) return;
      const projected = coords
        .map((c) => {
          const p = safeProject(map, c);
          if (!p) return null;
          return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
        })
        .filter((p): p is string => p !== null);
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
  }, [playing, mapRef, coords]);

  if (!playing || !route || coords.length < 2 || !points || !portalTarget) return null;

  const visiblePoints = trimPoints(points, Math.max(0.02, progress));
  if (!isValidPointsString(visiblePoints)) return null;

  return createPortal(
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-visible"
      style={{ zIndex: 1 }}
      width="100%"
      height="100%"
    >
      <polyline
        points={visiblePoints}
        fill="none"
        stroke={CORE}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.35"
        strokeDasharray="4 6"
      />
      <polyline
        points={visiblePoints}
        fill="none"
        stroke={CORE}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.72"
        strokeDasharray="4 6"
        strokeDashoffset="40"
        style={{ animation: "lp-dash 1.4s linear infinite" }}
      />
    </svg>,
    portalTarget,
  );
}

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Marker as MapMarker, useMap } from "react-map-gl/mapbox";
import { useDemoStore } from "@/store/useDemoStore";
import { DEMO_BOUNDS, DEMO_END, DEMO_ROUTES, DEMO_START } from "@/lib/demoRoutes";

type ProjectedRoute = { key: string; color: string; points: string; delay: number };

export function DemoLayers() {
  const active = useDemoStore((s) => s.active);
  const { current: mapRef } = useMap();
  const [projectedRoutes, setProjectedRoutes] = useState<ProjectedRoute[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Fit both endpoints in view whenever demo turns on
  useEffect(() => {
    if (!active || !mapRef) return;
    const map = mapRef.getMap();
    try {
      map.fitBounds(DEMO_BOUNDS, {
        padding: { top: 160, bottom: 220, left: 80, right: 360 },
        duration: 1200,
        pitch: 30,
        bearing: -6,
        maxZoom: 14.2,
      });
    } catch { /* ignore */ }
  }, [active, mapRef]);

  // SVG overlay uses real map projection, so the route lines are always visible above the basemap.
  useEffect(() => {
    if (!active || !mapRef) {
      setProjectedRoutes([]);
      return;
    }

    const map = mapRef.getMap();
    let frame = 0;
    let cancelled = false;

    const updateProjection = () => {
      if (cancelled) return;
      const rect = map.getContainer().getBoundingClientRect();
      setProjectedRoutes(
        DEMO_ROUTES.map((route, i) => ({
          key: route.key,
          color: route.color,
          delay: i * 0.16,
          points: route.coords
            .map((coord) => {
              const point = map.project(coord);
              return `${(point.x + rect.left).toFixed(1)},${(point.y + rect.top).toFixed(1)}`;
            })
            .join(" "),
        })),
      );
    };

    const scheduleProjection = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        updateProjection();
      });
    };

    updateProjection();
    map.on("render", scheduleProjection);
    map.on("move", scheduleProjection);
    map.on("resize", scheduleProjection);

    return () => {
      cancelled = true;
      if (frame) cancelAnimationFrame(frame);
      map.off("render", scheduleProjection);
      map.off("move", scheduleProjection);
      map.off("resize", scheduleProjection);
    };
  }, [active, mapRef]);

  if (!active) return null;

  const routeOverlay = mounted && projectedRoutes.length > 0
    ? createPortal(
        <svg
          aria-hidden="true"
          className="pointer-events-none"
          width={window.innerWidth}
          height={window.innerHeight}
          viewBox={`0 0 ${window.innerWidth} ${window.innerHeight}`}
          preserveAspectRatio="none"
          style={{ position: "fixed", inset: 0, zIndex: 80, overflow: "visible" }}
        >
          {projectedRoutes.map((route) => (
            <g key={route.key}>
              <polyline
                points={route.points}
                fill="none"
                stroke={route.color}
                strokeWidth="22"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeOpacity="0.42"
                strokeDasharray="1"
                strokeDashoffset="1"
                pathLength="1"
              >
                <animate attributeName="stroke-dashoffset" from="1" to="0" dur="1.25s" begin={`${route.delay}s`} fill="freeze" />
              </polyline>
              <polyline
                points={route.points}
                fill="none"
                stroke={route.color}
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeOpacity="1"
                strokeDasharray="1"
                strokeDashoffset="1"
                pathLength="1"
              >
                <animate attributeName="stroke-dashoffset" from="1" to="0" dur="1.25s" begin={`${route.delay}s`} fill="freeze" />
              </polyline>
            </g>
          ))}
        </svg>,
        document.body,
      )
    : null;

  return (
    <>
      {routeOverlay}

      <MapMarker longitude={DEMO_START.coord[0]} latitude={DEMO_START.coord[1]} anchor="bottom">
        <div
          className="glass-strong animate-scale-in"
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 600,
            color: "var(--ink)",
            boxShadow: "var(--shadow-card)",
            whiteSpace: "nowrap",
          }}
        >
          A · {DEMO_START.name}
        </div>
      </MapMarker>

      <MapMarker longitude={DEMO_END.coord[0]} latitude={DEMO_END.coord[1]} anchor="bottom">
        <div
          className="glass-strong animate-scale-in"
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 600,
            color: "var(--ink)",
            boxShadow: "var(--shadow-card)",
            whiteSpace: "nowrap",
          }}
        >
          B · {DEMO_END.name}
        </div>
      </MapMarker>
    </>
  );
}

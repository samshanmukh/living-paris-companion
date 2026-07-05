import { useMemo } from "react";
import { Layer, Marker as MapMarker, Source } from "react-map-gl/mapbox";
import { motion, AnimatePresence } from "framer-motion";
import type { Feature, LineString } from "geojson";
import { Footprints, MapPin } from "lucide-react";
import { useCityStore } from "@/store/useCityStore";
import { splitRouteByStop } from "@/lib/mapCamera";
import { isPlaceOnlyRoute } from "@/lib/routePreview";
import type { RouteResponse, RouteWaypoint } from "@/lib/types";

const ROUTE_COLOR = "#C77E6A";
const ROUTE_DIM = "rgba(199, 126, 106, 0.42)";
const ROUTE_DASH: [number, number] = [1.6, 2.4];

function lineFeature(coords: [number, number][]): Feature<LineString> | null {
  if (coords.length < 2) return null;
  return {
    type: "Feature",
    geometry: { type: "LineString", coordinates: coords },
    properties: {},
  };
}

/** Thin dotted route line — renders below destination markers. */
export function RouteLineLayer() {
  const route = useCityStore((s) => s.route);
  const geometry = route?.geometry ?? null;
  const routeWaypoints = useCityStore((s) => s.routeWaypoints);
  const activeRouteStop = useCityStore((s) => s.activeRouteStop);
  const routePreviewPlaying = useCityStore((s) => s.routePreviewPlaying);
  const routePreviewProgress = useCityStore((s) => s.routePreviewProgress);

  const trimEnd = routePreviewPlaying ? Math.max(0.004, routePreviewProgress) : 1;

  const segments = useMemo(() => {
    if (!geometry || !routeWaypoints?.length) {
      return { completed: null, active: geometry, upcoming: null };
    }
    const coords = geometry.geometry.coordinates as [number, number][];
    if (activeRouteStop < 1 || routePreviewPlaying) {
      return { completed: null, active: geometry, upcoming: null };
    }
    const split = splitRouteByStop(coords, routeWaypoints, activeRouteStop);
    return {
      completed: lineFeature(split.completed),
      active: lineFeature(split.active.length >= 2 ? split.active : coords),
      upcoming: lineFeature(split.upcoming),
    };
  }, [geometry, routeWaypoints, activeRouteStop, routePreviewPlaying]);

  if (!geometry) return null;

  return (
    <>
      {segments.completed && (
        <Source id="lp-route-done" type="geojson" data={segments.completed}>
          <Layer
            id="lp-route-done-line"
            type="line"
            layout={{ "line-cap": "round", "line-join": "round" }}
            paint={{
              "line-color": ROUTE_DIM,
              "line-width": 2,
              "line-opacity": 0.45,
              "line-dasharray": ROUTE_DASH,
            }}
          />
        </Source>
      )}

      <Source id="lp-route" type="geojson" data={segments.active ?? geometry} lineMetrics>
        <Layer
          id="lp-route-halo"
          type="line"
          layout={{ "line-cap": "round", "line-join": "round" }}
          paint={{
            "line-color": ROUTE_COLOR,
            "line-width": 4,
            "line-opacity": 0.1,
            "line-blur": 1.5,
            "line-trim-offset": [0, trimEnd],
          }}
        />
        <Layer
          id="lp-route-line"
          type="line"
          layout={{ "line-cap": "round", "line-join": "round" }}
          paint={{
            "line-color": ROUTE_COLOR,
            "line-width": 2.25,
            "line-opacity": 0.58,
            "line-dasharray": ROUTE_DASH,
            "line-trim-offset": [0, trimEnd],
          }}
        />
      </Source>

      {segments.upcoming && (
        <Source id="lp-route-next" type="geojson" data={segments.upcoming}>
          <Layer
            id="lp-route-next-line"
            type="line"
            layout={{ "line-cap": "round", "line-join": "round" }}
            paint={{
              "line-color": ROUTE_COLOR,
              "line-width": 2,
              "line-opacity": 0.26,
              "line-dasharray": [1, 2.5],
            }}
          />
        </Source>
      )}
    </>
  );
}

function RouteStopPin({
  wp,
  i,
  isActive,
  isStart,
  stopNum,
  placeOnly,
}: {
  wp: RouteWaypoint;
  i: number;
  isActive: boolean;
  isStart: boolean;
  stopNum: number;
  placeOnly: boolean;
}) {
  return (
    <MapMarker longitude={wp.lon} latitude={wp.lat} anchor="center" style={{ zIndex: isActive ? 120 : 100 }}>
      <div className="relative flex flex-col items-center">
        <AnimatePresence>
          {isActive && wp.name && (
            <motion.div
              key={`label-${i}`}
              initial={{ opacity: 0, y: 6, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
              className="glass-strong pointer-events-none absolute bottom-full mb-2 max-w-[160px] truncate whitespace-nowrap px-3 py-1.5"
              style={{
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                color: "var(--ink)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              {wp.name}
            </motion.div>
          )}
        </AnimatePresence>

        {isActive && (
          <motion.span
            className="absolute rounded-full"
            style={{ width: 36, height: 36, border: "1.5px solid rgba(199,126,106,0.5)" }}
            animate={{ scale: [0.9, 1.2, 0.9], opacity: [0.35, 0.08, 0.35] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        {isStart ? (
          <div
            className="relative z-10 grid size-7 place-items-center rounded-full"
            style={{
              background: "#4A7FD4",
              border: "2px solid var(--paper-2)",
              boxShadow: isActive
                ? "0 0 0 3px rgba(74,127,212,0.28), 0 3px 10px rgba(28,26,22,0.2)"
                : "0 2px 8px rgba(28,26,22,0.18)",
            }}
          >
            <MapPin size={13} strokeWidth={2.2} color="#fff" fill="#fff" />
          </div>
        ) : (
          <div
            className="relative z-10 grid place-items-center rounded-full font-bold"
            style={{
              width: isActive ? 28 : 24,
              height: isActive ? 28 : 24,
              fontSize: isActive ? 12 : 10,
              background: isActive ? ROUTE_COLOR : "var(--ink)",
              color: "#fff",
              border: "2px solid var(--paper-2)",
              boxShadow: isActive
                ? "0 0 0 3px rgba(199,126,106,0.32), 0 3px 10px rgba(28,26,22,0.2)"
                : "0 2px 8px rgba(28,26,22,0.16)",
            }}
          >
            {placeOnly ? i + 1 : stopNum}
          </div>
        )}
      </div>
    </MapMarker>
  );
}

function RouteMidpointBadge({ lon, lat, route }: { lon: number; lat: number; route: RouteResponse }) {
  return (
    <MapMarker longitude={lon} latitude={lat} anchor="center" style={{ zIndex: 90 }}>
      <div
        className="glass-strong inline-flex items-center gap-1.5"
        style={{
          padding: "5px 9px",
          borderRadius: 999,
          color: "var(--ink)",
          fontSize: 11,
          fontWeight: 500,
          boxShadow: "var(--shadow-soft)",
          whiteSpace: "nowrap",
          opacity: 0.9,
        }}
      >
        <Footprints size={12} strokeWidth={1.7} style={{ color: ROUTE_COLOR }} />
        <span>{Math.round(route.durationMinutes)} min</span>
        <span style={{ color: "var(--ink-3)" }}>·</span>
        <span style={{ color: "var(--ink-2)" }}>{(route.distanceMeters / 1000).toFixed(1)} km</span>
      </div>
    </MapMarker>
  );
}

/** Route stop pins — hidden for place-only routes (destinations show order). */
export function RouteStopMarkers() {
  const route = useCityStore((s) => s.route);
  const routeWaypoints = useCityStore((s) => s.routeWaypoints);
  const activeRouteStop = useCityStore((s) => s.activeRouteStop);
  const routePreviewPlaying = useCityStore((s) => s.routePreviewPlaying);

  const placeOnly = routeWaypoints ? isPlaceOnlyRoute(routeWaypoints) : false;
  const stops = routeWaypoints ?? [];

  const midpoint = useMemo<[number, number] | null>(() => {
    const coords = route?.geometry?.geometry?.coordinates as [number, number][] | undefined;
    if (!coords || coords.length < 2) return null;
    return coords[Math.floor(coords.length / 2)];
  }, [route]);

  if (!route || !stops.length || placeOnly) return null;

  return (
    <>
      {stops.map((wp, i) => (
        <RouteStopPin
          key={wp.id ?? `${wp.lon}-${wp.lat}-${i}`}
          wp={wp}
          i={i}
          isActive={i === activeRouteStop}
          isStart={i === 0 && !placeOnly}
          stopNum={placeOnly ? i + 1 : i}
          placeOnly={placeOnly}
        />
      ))}
      {midpoint && !routePreviewPlaying && (
        <RouteMidpointBadge lon={midpoint[0]} lat={midpoint[1]} route={route} />
      )}
    </>
  );
}

export function RouteLayer() {
  return (
    <>
      <RouteLineLayer />
      <RouteStopMarkers />
    </>
  );
}

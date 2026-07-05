import { useMemo } from "react";
import { Layer, Marker as MapMarker, Source } from "react-map-gl/mapbox";
import type { Feature, LineString } from "geojson";
import { useCityStore } from "@/store/useCityStore";
import { splitRouteByStop } from "@/lib/mapCamera";
import { Footprints, MapPin } from "lucide-react";

const ROUTE_COLOR = "#C77E6A";
const ROUTE_DIM = "#C77E6A88";
const ROUTE_CASING = "#F4F0E8";

function lineFeature(coords: [number, number][]): Feature<LineString> | null {
  if (coords.length < 2) return null;
  return {
    type: "Feature",
    geometry: { type: "LineString", coordinates: coords },
    properties: {},
  };
}

export function RouteLayer() {
  const route = useCityStore((s) => s.route);
  const geometry = route?.geometry ?? null;
  const routeWaypoints = useCityStore((s) => s.routeWaypoints);
  const activeRouteStop = useCityStore((s) => s.activeRouteStop);

  const segments = useMemo(() => {
    if (!geometry || !routeWaypoints?.length) {
      return { completed: null, active: geometry, upcoming: null };
    }
    const coords = geometry.geometry.coordinates as [number, number][];
    if (activeRouteStop < 1) {
      return { completed: null, active: geometry, upcoming: null };
    }
    const split = splitRouteByStop(coords, routeWaypoints, activeRouteStop);
    return {
      completed: lineFeature(split.completed),
      active: lineFeature(split.active.length >= 2 ? split.active : coords),
      upcoming: lineFeature(split.upcoming),
    };
  }, [geometry, routeWaypoints, activeRouteStop]);

  const midpoint = useMemo<[number, number] | null>(() => {
    if (!geometry) return null;
    const coords = geometry.geometry.coordinates as [number, number][];
    if (coords.length < 2) return null;
    return coords[Math.floor(coords.length / 2)];
  }, [geometry]);

  const stops = routeWaypoints ?? [];

  if (!geometry) return null;

  return (
    <>
      {segments.completed && (
        <Source id="lp-route-done" type="geojson" data={segments.completed}>
          <Layer
            id="lp-route-done-line"
            type="line"
            layout={{ "line-cap": "round", "line-join": "round" }}
            paint={{ "line-color": ROUTE_DIM, "line-width": 4, "line-opacity": 0.55 }}
          />
        </Source>
      )}

      <Source id="lp-route" type="geojson" data={segments.active ?? geometry}>
        <Layer
          id="lp-route-casing"
          type="line"
          layout={{ "line-cap": "round", "line-join": "round" }}
          paint={{ "line-color": ROUTE_CASING, "line-width": 10, "line-opacity": 0.96 }}
        />
        <Layer
          id="lp-route-line"
          type="line"
          layout={{ "line-cap": "round", "line-join": "round" }}
          paint={{ "line-color": ROUTE_COLOR, "line-width": 5.5, "line-opacity": 0.96 }}
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
              "line-width": 4,
              "line-opacity": 0.35,
              "line-dasharray": [1.5, 2],
            }}
          />
        </Source>
      )}

      {stops.map((wp, i) => {
        const isActive = i === activeRouteStop;
        const isStart = i === 0;
        return (
          <MapMarker key={wp.id ?? `${wp.lon}-${wp.lat}-${i}`} longitude={wp.lon} latitude={wp.lat} anchor="center">
            {isStart ? (
              <div
                className="grid size-7 place-items-center rounded-full"
                style={{
                  background: "#4A7FD4",
                  border: "2.5px solid var(--paper-2)",
                  boxShadow: isActive ? "0 0 0 4px rgba(74,127,212,0.35)" : "0 3px 12px rgba(28,26,22,0.25)",
                }}
              >
                <MapPin size={14} strokeWidth={2.2} color="#fff" fill="#fff" />
              </div>
            ) : (
              <div
                className="grid place-items-center rounded-full font-bold"
                style={{
                  width: isActive ? 28 : 24,
                  height: isActive ? 28 : 24,
                  fontSize: isActive ? 12 : 11,
                  background: isActive ? ROUTE_COLOR : "var(--ink)",
                  color: "#fff",
                  border: "2.5px solid var(--paper-2)",
                  boxShadow: isActive
                    ? "0 0 0 4px rgba(199,126,106,0.4), 0 4px 14px rgba(28,26,22,0.28)"
                    : "0 3px 10px rgba(28,26,22,0.22)",
                  transition: "width 0.2s, height 0.2s",
                }}
              >
                {i}
              </div>
            )}
          </MapMarker>
        );
      })}

      {midpoint && route && (
        <MapMarker longitude={midpoint[0]} latitude={midpoint[1]} anchor="center">
          <div
            className="glass-strong inline-flex items-center gap-1.5"
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              color: "var(--ink)",
              fontSize: 12,
              fontWeight: 500,
              boxShadow: "var(--shadow-card)",
              whiteSpace: "nowrap",
            }}
          >
            <Footprints size={13} strokeWidth={1.7} style={{ color: ROUTE_COLOR }} />
            <span>{Math.round(route.durationMinutes)} min</span>
            <span style={{ color: "var(--ink-3)" }}>·</span>
            <span style={{ color: "var(--ink-2)" }}>{(route.distanceMeters / 1000).toFixed(1)} km</span>
          </div>
        </MapMarker>
      )}
    </>
  );
}

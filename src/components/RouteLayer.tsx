import { useEffect, useMemo } from "react";
import { Layer, Marker as MapMarker, Source, useMap } from "react-map-gl/mapbox";
import type { Feature, LineString } from "geojson";
import { useCityStore } from "@/store/useCityStore";
import { Footprints } from "lucide-react";

interface Props {
  geometry: Feature<LineString> | null;
  padding?: { top: number; bottom: number; left: number; right: number };
}

const ROUTE_COLOR = "#C77E6A";
const ROUTE_CASING = "#F4F0E8";

export function RouteLayer({ geometry, padding }: Props) {
  const route = useCityStore((s) => s.route);
  const { current: mapRef } = useMap();

  useEffect(() => {
    if (!geometry || !mapRef) return;
    const coords = geometry.geometry.coordinates as [number, number][];
    if (coords.length < 2) return;

    let minLon = Infinity, minLat = Infinity, maxLon = -Infinity, maxLat = -Infinity;
    for (const [lon, lat] of coords) {
      if (lon < minLon) minLon = lon;
      if (lat < minLat) minLat = lat;
      if (lon > maxLon) maxLon = lon;
      if (lat > maxLat) maxLat = lat;
    }

    const map = mapRef.getMap();
    const run = () => {
      try {
        map.fitBounds(
          [[minLon, minLat], [maxLon, maxLat]],
          {
            padding: padding ?? { top: 140, bottom: 180, left: 60, right: 60 },
            duration: 900,
            maxZoom: 15.5,
          },
        );
      } catch { /* ignore */ }
    };
    if (map.isStyleLoaded()) run();
    else map.once("load", run);
  }, [geometry, mapRef, padding]);

  const midpoint = useMemo<[number, number] | null>(() => {
    if (!geometry) return null;
    const coords = geometry.geometry.coordinates as [number, number][];
    if (coords.length < 2) return null;
    return coords[Math.floor(coords.length / 2)];
  }, [geometry]);

  if (!geometry) return null;

  return (
    <>
      <Source id="lp-route" type="geojson" data={geometry}>
        <Layer
          id="lp-route-casing"
          type="line"
          layout={{ "line-cap": "round", "line-join": "round" }}
          paint={{
            "line-color": ROUTE_CASING,
            "line-width": 9,
            "line-opacity": 0.95,
          }}
        />
        <Layer
          id="lp-route-line"
          type="line"
          layout={{ "line-cap": "round", "line-join": "round" }}
          paint={{
            "line-color": ROUTE_COLOR,
            "line-width": 5,
            "line-opacity": 0.94,
          }}
        />
      </Source>

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

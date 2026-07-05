import { useEffect } from "react";
import type { MapRef } from "react-map-gl/mapbox";
import { useCityStore } from "@/store/useCityStore";
import { MAP_PADDING, bboxFromCoords } from "@/lib/mapCamera";

/** Drives map camera from selection + route navigation. */
export function useMapCamera(mapRef: React.RefObject<MapRef | null>, mapReady: boolean, reduced: boolean) {
  const selected = useCityStore((s) => s.selected);
  const selectionTick = useCityStore((s) => s.selectionTick);
  const mapFocus = useCityStore((s) => s.mapFocus);
  const mapFocusTick = useCityStore((s) => s.mapFocusTick);
  const route = useCityStore((s) => s.route);
  const routeWaypoints = useCityStore((s) => s.routeWaypoints);

  // Always zoom when user picks a place.
  useEffect(() => {
    if (!mapReady || !selected) return;
    const [lon, lat] = selected.geometry.coordinates as [number, number];
    const map = mapRef.current?.getMap();
    if (!map) return;

    const duration = reduced ? 300 : 1800;
    window.requestAnimationFrame(() => {
      try {
        map.stop();
        map.flyTo({
          center: [lon, lat],
          zoom: 17.6,
          pitch: 65,
          bearing: -8,
          padding: MAP_PADDING,
          duration,
          curve: 1.5,
          speed: 0.8,
          essential: true,
        });
      } catch { /* ignore */ }
    });
  }, [selected, selectionTick, mapReady, reduced, mapRef]);

  // Route overview, step-through stops, and bulk place fits.
  useEffect(() => {
    if (!mapReady || !mapFocus) return;
    const map = mapRef.current?.getMap();
    if (!map) return;

    const duration = reduced ? 280 : 1600;
    const run = () => {
      try {
        map.stop();
        switch (mapFocus.kind) {
          case "place": {
            map.flyTo({
              center: [mapFocus.lon, mapFocus.lat],
              zoom: 17.6,
              pitch: 65,
              bearing: -8,
              padding: MAP_PADDING,
              duration,
              curve: 1.5,
              speed: 0.8,
              essential: true,
            });
            break;
          }
          case "route-stop": {
            const wp = routeWaypoints?.[mapFocus.stopIndex];
            if (!wp) return;
            map.flyTo({
              center: [wp.lon, wp.lat],
              zoom: mapFocus.stopIndex === 0 ? 16.4 : 17.2,
              pitch: 58,
              bearing: -10,
              padding: MAP_PADDING,
              duration,
              curve: 1.4,
              speed: 0.85,
              essential: true,
            });
            break;
          }
          case "route-overview": {
            const coords = route?.geometry?.geometry?.coordinates as [number, number][] | undefined;
            if (!coords?.length) return;
            const { minLon, minLat, maxLon, maxLat } = bboxFromCoords(coords);
            map.fitBounds(
              [[minLon, minLat], [maxLon, maxLat]],
              { padding: MAP_PADDING, duration: duration * 0.75, maxZoom: 15.2 },
            );
            break;
          }
          case "places-overview": {
            if (mapFocus.coords.length < 1) return;
            const { minLon, minLat, maxLon, maxLat } = bboxFromCoords(mapFocus.coords);
            map.fitBounds(
              [[minLon, minLat], [maxLon, maxLat]],
              { padding: MAP_PADDING, duration: duration * 0.85, maxZoom: 14.8 },
            );
            break;
          }
        }
      } catch { /* ignore */ }
    };

    window.requestAnimationFrame(run);
  }, [mapFocus, mapFocusTick, mapReady, reduced, route, routeWaypoints, mapRef]);
}

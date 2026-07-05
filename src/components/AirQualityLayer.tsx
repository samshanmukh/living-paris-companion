import { useEffect, useMemo, useState } from "react";
import { useMapStyleReady } from "@/hooks/useMapStyleReady";
import { Layer, Marker as MapMarker, Source, useMap } from "react-map-gl/mapbox";
import { AnimatePresence } from "framer-motion";
import { useSceneStore } from "@/store/useSceneStore";
import { usePrefsStore } from "@/store/usePrefsStore";
import { fetchParisAirQuality, tileUrlTemplate, visibleStations } from "@/lib/parisAirQuality";
import { AirQualityMarker } from "./AirQualityMarker";

const RASTER_SOURCE_ID = "lp-aqi-raster-src";
const RASTER_LAYER_ID = "lp-aqi-raster";

export function AirQualityLayer() {
  const styleReady = useMapStyleReady();
  const visible = useSceneStore((s) => s.airQualityVisible);
  const snapshot = useSceneStore((s) => s.airQualitySnapshot);
  const setSnapshot = useSceneStore((s) => s.setAirQualitySnapshot);
  const reduced = usePrefsStore((s) => s.reducedMotion);
  const { current: mapRef } = useMap();
  const [zoom, setZoom] = useState(12);

  const tiles = useMemo(() => [tileUrlTemplate()], []);

  useEffect(() => {
    if (!visible) {
      setSnapshot(null);
      return;
    }
    let cancelled = false;
    const load = () => {
      fetchParisAirQuality()
        .then((data) => {
          if (!cancelled) setSnapshot(data);
        })
        .catch(() => {});
    };
    load();
    const id = window.setInterval(load, 15 * 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [visible, setSnapshot]);

  useEffect(() => {
    if (!visible || !mapRef) return;
    const map = mapRef.getMap();
    const syncZoom = () => setZoom(map.getZoom());
    syncZoom();
    map.on("zoom", syncZoom);
    map.on("moveend", syncZoom);
    return () => {
      map.off("zoom", syncZoom);
      map.off("moveend", syncZoom);
    };
  }, [visible, mapRef]);

  useEffect(() => {
    if (!visible || !mapRef || reduced) return;
    const map = mapRef.getMap();
    let frame = 0;
    let start = performance.now();
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      const opacity = 0.34 + Math.sin(t * 1.15) * 0.14;
      try {
        if (map.getLayer(RASTER_LAYER_ID)) {
          map.setPaintProperty(RASTER_LAYER_ID, "raster-opacity", opacity);
        }
      } catch {
        /* layer not ready */
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [visible, mapRef, reduced]);

  if (!visible || !styleReady) return null;

  const stations = snapshot ? visibleStations(snapshot.stations, zoom) : [];

  return (
    <>
      <Source
        id={RASTER_SOURCE_ID}
        type="raster"
        tiles={tiles}
        tileSize={256}
        attribution={snapshot?.attribution}
      >
        <Layer
          id={RASTER_LAYER_ID}
          type="raster"
          paint={{
            "raster-opacity": reduced ? 0.42 : 0.38,
            "raster-fade-duration": reduced ? 0 : 400,
          }}
        />
      </Source>

      <AnimatePresence>
        {stations.map((station, i) => (
          <MapMarker
            key={`aqi-${station.id}-${station.lat}-${station.lon}`}
            longitude={station.lon}
            latitude={station.lat}
            anchor="center"
          >
            <AirQualityMarker station={station} index={i} reducedMotion={reduced} />
          </MapMarker>
        ))}
      </AnimatePresence>
    </>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import Map, { Marker as MapMarker, type MapRef } from "react-map-gl/mapbox";
import { AnimatePresence } from "framer-motion";
import { useCityStore } from "@/store/useCityStore";
import { usePrefsStore } from "@/store/usePrefsStore";
import { useSceneStore } from "@/store/useSceneStore";
import { ParisMarker } from "./Marker";
import { RouteLayer } from "./RouteLayer";
import { UserLocationMarker } from "./UserLocationMarker";
import { DemoLayers } from "./DemoLayers";
import { fetchParisConditions, type ParisConditions, type LightPreset } from "@/lib/parisWeather";

const MAPBOX_TOKEN =
  (import.meta.env.VITE_MAPBOX_TOKEN as string | undefined) ??
  (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined) ??
  (import.meta.env.NEXT_PUBLIC_MAPBOX_TOKEN as string | undefined);

const MAP_PADDING = { top: 88, bottom: 300, left: 48, right: 48 };

const OPENING_VIEW = {
  longitude: 2.3487,
  latitude: 48.855,
  zoom: 12.6,
  pitch: 20,
  bearing: 0,
} as const;

const DEFAULT_VIEW = {
  longitude: 2.3387,
  latitude: 48.859,
  zoom: 14.6,
  pitch: 55,
  bearing: -12,
} as const;

export function MapCanvas() {
  const geojson = useCityStore((s) => s.geojson);
  const center = useCityStore((s) => s.center);
  const selected = useCityStore((s) => s.selected);
  const route = useCityStore((s) => s.route);
  const select = useCityStore((s) => s.select);
  const rainMode = useCityStore((s) => s.rainMode);
  const hourOverride = useSceneStore((s) => s.hourOverride);
  const seasonOverride = useSceneStore((s) => s.seasonOverride);
  const rainOverride = useSceneStore((s) => s.rainOverride);
  const reduced = usePrefsStore((s) => s.reducedMotion);
  const mapRef = useRef<MapRef | null>(null);
  const [conditions, setConditions] = useState<ParisConditions | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Smooth flyTo on center / selection — skip while a route is drawn (RouteLayer fits bounds).
  useEffect(() => {
    if (route) return;
    const map = mapRef.current?.getMap?.();
    if (!map) return;
    map.flyTo({
      center,
      zoom: selected ? 16.6 : 14.6,
      pitch: selected ? 62 : 55,
      bearing: selected ? -6 : -12,
      padding: MAP_PADDING,
      duration: reduced ? 300 : 1600,
      curve: 1.5,
      speed: 0.85,
      essential: true,
    });
  }, [center, selected, reduced, route]);

  // Weather polling
  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetchParisConditions()
        .then((c) => { if (!cancelled) setConditions(c); })
        .catch(() => {});
    };
    load();
    const id = window.setInterval(load, 10 * 60 * 1000);
    return () => { cancelled = true; window.clearInterval(id); };
  }, []);

  // Lighting + weather: live Paris conditions, with conversation-driven overrides only.
  useEffect(() => {
    if (!mapReady || !conditions) return;
    const map = mapRef.current?.getMap?.();
    if (!map) return;

    let preset: LightPreset = conditions.lightPreset;
    if (hourOverride != null) {
      if (hourOverride >= 5 && hourOverride < 8) preset = "dawn";
      else if (hourOverride >= 8 && hourOverride < 18) preset = "day";
      else if (hourOverride >= 18 && hourOverride < 21) preset = "dusk";
      else preset = "night";
    }

    try {
      map.setConfigProperty("basemap", "lightPreset", preset);
      map.setConfigProperty("basemap", "showLandmarkIcons", preset !== "night");
    } catch {}

    // Night / dusk atmosphere
    try {
      if (preset === "night") {
        map.setFog({
          color: "rgb(18, 20, 32)",
          "high-color": "rgb(35, 38, 52)",
          "horizon-blend": 0.12,
          "space-color": "rgb(12, 14, 24)",
          "star-intensity": 0.35,
        });
      } else if (preset === "dusk") {
        map.setFog({
          color: "rgb(55, 48, 42)",
          "high-color": "rgb(120, 90, 70)",
          "horizon-blend": 0.14,
          "space-color": "rgb(40, 35, 50)",
          "star-intensity": 0.08,
        });
      } else {
        map.setFog({
          color: "rgb(244, 240, 232)",
          "high-color": "rgb(220, 220, 224)",
          "horizon-blend": 0.08,
          "space-color": "rgb(220, 220, 224)",
          "star-intensity": 0,
        });
      }
    } catch {}

    const anyMap = map as unknown as {
      setRain?: (opts: Record<string, unknown> | null) => void;
      setSnow?: (opts: Record<string, unknown> | null) => void;
    };

    let precip: "rain" | "snow" | "none" = conditions.precip;
    let intensity = conditions.intensity;
    if (rainOverride === true || rainMode) { precip = "rain"; intensity = Math.max(intensity, 0.65); }
    else if (rainOverride === false) { precip = "none"; intensity = 0; }
    else if (seasonOverride === "winter" && conditions.precip === "snow") { precip = "snow"; }

    try {
      if (precip === "rain" && anyMap.setRain) {
        anyMap.setRain({
          density: 0.35 + intensity * 0.4, intensity: 0.7, color: "#a8b8c8", opacity: 0.6,
          "vignette-color": "#3a4055", vignette: 0.35, "center-thinning": 0.3,
          direction: [0, 80], "droplet-size": [2.5, 12], "distortion-strength": 0.4,
        });
        anyMap.setSnow?.(null);
      } else if (precip === "snow" && anyMap.setSnow) {
        anyMap.setSnow({
          density: 0.55, intensity: 0.8, color: "#ffffff", opacity: 0.9, "flake-size": 0.8,
          "vignette-color": "#a0b0c8", vignette: 0.35, "center-thinning": 0.3, direction: [0, 45],
        });
        anyMap.setRain?.(null);
      } else {
        anyMap.setRain?.(null);
        anyMap.setSnow?.(null);
      }
    } catch {}
  }, [conditions, mapReady, hourOverride, seasonOverride, rainOverride, rainMode]);

  const features = useMemo(() => geojson?.features ?? [], [geojson]);

  const onMapLoad = () => {
    const map = mapRef.current?.getMap?.();
    if (!map) return;

    // Standard style — clean editorial base; accent colors live only on markers/route.
    try {
      map.setConfigProperty("basemap", "lightPreset", "day");
      map.setConfigProperty("basemap", "theme", "faded");
      map.setConfigProperty("basemap", "showPlaceLabels", true);
      map.setConfigProperty("basemap", "showPointOfInterestLabels", false);
      map.setConfigProperty("basemap", "showRoadLabels", false);
      map.setConfigProperty("basemap", "showTransitLabels", false);
      map.setConfigProperty("basemap", "show3dObjects", true);
      map.setConfigProperty("basemap", "showLandmarkIcons", true);
      map.setConfigProperty("basemap", "colorPlaceLabel", "#1C1A16");
    } catch {}

    try {
      map.setFog({
        color: "rgb(244, 240, 232)",
        "high-color": "rgb(220, 220, 224)",
        "horizon-blend": 0.08,
        "space-color": "rgb(220, 220, 224)",
        "star-intensity": 0,
      });
    } catch {}

    setMapReady(true);

    if (!reduced) {
      window.setTimeout(() => {
        map.flyTo({
          center: [DEFAULT_VIEW.longitude, DEFAULT_VIEW.latitude],
          zoom: DEFAULT_VIEW.zoom,
          pitch: DEFAULT_VIEW.pitch,
          bearing: DEFAULT_VIEW.bearing,
          duration: 2600,
          curve: 1.45,
          speed: 0.75,
          essential: true,
        });
      }, 160);
    }
  };

  if (!MAPBOX_TOKEN) {
    return (
      <div className="absolute inset-0 flex items-center justify-center" style={{ background: "var(--paper-2)" }}>
        <div className="glass max-w-md p-8 text-center" style={{ borderRadius: "var(--r-panel)" }}>
          <p className="font-serif text-3xl leading-tight" style={{ color: "var(--ink)" }}>Paris is waiting</p>
          <p className="mt-3 text-sm" style={{ color: "var(--ink-2)" }}>
            Add a Mapbox public token as <code>VITE_MAPBOX_TOKEN</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={reduced ? DEFAULT_VIEW : OPENING_VIEW}
        mapStyle="mapbox://styles/mapbox/standard"
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
        onLoad={onMapLoad}
        antialias
      >
        <RouteLayer geometry={route?.geometry ?? null} padding={MAP_PADDING} />
        <DemoLayers />
        <UserLocationMarker />
        <AnimatePresence>
          {features.map((f, i) => {
            const [lon, lat] = f.geometry.coordinates as [number, number];
            const id = f.properties.id ?? `${i}-${lon}-${lat}`;
            return (
              <MapMarker key={id} longitude={lon} latitude={lat} anchor="center">
                <ParisMarker
                  feature={f}
                  index={i}
                  selected={selected?.properties.id === f.properties.id}
                  onClick={() => select(f)}
                />
              </MapMarker>
            );
          })}
        </AnimatePresence>
      </Map>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import Map, { Marker as MapMarker, type MapRef } from "react-map-gl/mapbox";
import { AnimatePresence } from "framer-motion";
import { useCityStore } from "@/store/useCityStore";
import { usePrefsStore } from "@/store/usePrefsStore";
import { useSceneStore, type Season } from "@/store/useSceneStore";
import { useUIStore } from "@/store/useUIStore";
import { ParisMarker } from "./Marker";
import { MapAnnotationMarker } from "./MapAnnotationMarker";
import { RouteLineLayer, RouteStopMarkers } from "./RouteLayer";
import { RoutePreviewOverlay } from "./RoutePreviewOverlay";
import { UserLocationMarker } from "./UserLocationMarker";
import { DemoLayers } from "./DemoLayers";
import { AirQualityLayer } from "./AirQualityLayer";
import { AirQualityLegend } from "./AirQualityLegend";
import { MapControls } from "./MapControls";
import { fetchParisConditions, resolveLightPreset, type ParisConditions } from "@/lib/parisWeather";
import { useMapCamera } from "@/hooks/useMapCamera";
import { useMoodMap } from "@/hooks/useMoodMap";
import { registerLiveMap } from "@/lib/mapController";
import { MAP_PADDING } from "@/lib/mapCamera";
import { MapFocusVeil } from "./MapFocusVeil";
import { MapLayerErrorBoundary } from "./MapLayerErrorBoundary";
import { MapSkyBirdsOverlay } from "./MapSkyBirdsOverlay";
import { MapSunLayer } from "./MapSunLayer";
import { ExperienceRoutePreview } from "./ExperienceRoutePreview";
import { buildItineraries } from "@/lib/itinerary";
import { moodFromParisHour } from "@/lib/moodFromHour";
import { personaFogBoost } from "@/lib/personaDefaults";
import { SeasonToggle } from "./SeasonToggle";

const MAPBOX_TOKEN =
  (import.meta.env.VITE_MAPBOX_TOKEN as string | undefined) ??
  (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined) ??
  (import.meta.env.NEXT_PUBLIC_MAPBOX_TOKEN as string | undefined);

const OPENING_VIEW = {
  longitude: 2.3487,
  latitude: 48.855,
  zoom: 11.8,
  pitch: 18,
  bearing: 0,
} as const;

const LAUNCH_VIEW = {
  longitude: 2.3498,
  latitude: 48.8572,
  zoom: 17.6,
  pitch: 65,
  bearing: -10,
} as const;

type FogSpec = {
  color: string;
  "high-color": string;
  "horizon-blend": number;
  "space-color": string;
  "star-intensity": number;
};

function seasonFog(season: Season | null, base: FogSpec): FogSpec {
  if (!season) return base;
  switch (season) {
    case "spring":
      return { ...base, color: "rgb(236, 244, 232)", "high-color": "rgb(210, 228, 200)" };
    case "summer":
      return { ...base, color: "rgb(252, 244, 228)", "high-color": "rgb(240, 220, 180)" };
    case "autumn":
      return { ...base, color: "rgb(248, 236, 220)", "high-color": "rgb(210, 170, 120)" };
    case "winter":
      return { ...base, color: "rgb(232, 238, 248)", "high-color": "rgb(200, 210, 230)", "star-intensity": 0.12 };
    default:
      return base;
  }
}

export function MapCanvas() {
  const geojson = useCityStore((s) => s.geojson);
  const mood = useCityStore((s) => s.mood);
  const rainMode = useCityStore((s) => s.rainMode);
  const center = useCityStore((s) => s.center);
  const route = useCityStore((s) => s.route);
  const routePreviewPlaying = useCityStore((s) => s.routePreviewPlaying);
  const activeExperienceIndex = useCityStore((s) => s.activeExperienceIndex);
  const selected = useCityStore((s) => s.selected);
  const select = useCityStore((s) => s.select);
  const hourOverride = useSceneStore((s) => s.hourOverride);
  const seasonOverride = useSceneStore((s) => s.seasonOverride);
  const rainOverride = useSceneStore((s) => s.rainOverride);
  const setParisConditions = useSceneStore((s) => s.setParisConditions);
  const activePersona = useUIStore((s) => s.activePersona);
  const reduced = usePrefsStore((s) => s.reducedMotion);
  const mapRef = useRef<MapRef | null>(null);
  const [conditions, setConditions] = useState<ParisConditions | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useMapCamera(mapRef, mapReady, reduced);
  useMoodMap(mapRef, mapReady, reduced);

  useEffect(() => {
    if (!mapReady) return;
    return registerLiveMap(() => mapRef.current?.getMap());
  }, [mapReady]);

  // Weather polling
  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetchParisConditions()
        .then((c) => {
          if (!cancelled) {
            setConditions(c);
            setParisConditions(c);
          }
        })
        .catch(() => {});
    };
    load();
    const id = window.setInterval(load, 10 * 60 * 1000);
    return () => { cancelled = true; window.clearInterval(id); };
  }, [setParisConditions]);

  // Mood-at-landing: default chat mood from live Paris hour before first message.
  useEffect(() => {
    if (!conditions) return;
    const city = useCityStore.getState();
    if (city.hasSent || city.mood !== "general") return;
    city.setMoodFromAction(moodFromParisHour(conditions.localHour, conditions.lightPreset));
  }, [conditions]);

  // Lighting + weather: live Paris conditions, with conversation-driven overrides only.
  useEffect(() => {
    if (!mapReady || !conditions) return;
    const map = mapRef.current?.getMap?.();
    if (!map) return;

    const preset = resolveLightPreset(conditions, hourOverride);

    try {
      map.setConfigProperty("basemap", "lightPreset", preset);
      map.setConfigProperty("basemap", "showLandmarkIcons", preset !== "night");
    } catch {}

    try {
      if (preset === "night") {
        const boost = personaFogBoost(activePersona);
        map.setFog({
          color: `rgb(${18 + boost * 120}, ${20 + boost * 120}, ${32 + boost * 80})`,
          "high-color": `rgb(${35 + boost * 100}, ${38 + boost * 100}, ${52 + boost * 60})`,
          "horizon-blend": 0.12 + boost,
          "space-color": "rgb(12, 14, 24)",
          "star-intensity": 0.35,
        });
      } else if (preset === "dusk") {
        map.setFog(seasonFog(seasonOverride, {
          color: "rgb(55, 48, 42)",
          "high-color": "rgb(120, 90, 70)",
          "horizon-blend": 0.14,
          "space-color": "rgb(40, 35, 50)",
          "star-intensity": 0.08,
        }));
      } else {
        map.setFog(seasonFog(seasonOverride, {
          color: "rgb(244, 240, 232)",
          "high-color": "rgb(220, 220, 224)",
          "horizon-blend": 0.08,
          "space-color": "rgb(220, 220, 224)",
          "star-intensity": 0,
        }));
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
  }, [conditions, mapReady, hourOverride, seasonOverride, rainOverride, rainMode, activePersona]);

  const features = useMemo(() => {
    if (route) return geojson?.features ?? [];
    if (geojson?.features.length && geojson.features.length >= 2) {
      const plans = buildItineraries(geojson.features, center, { mood, rainMode });
      return plans[activeExperienceIndex]?.stops ?? geojson.features;
    }
    return geojson?.features ?? [];
  }, [geojson, center, mood, rainMode, route, activeExperienceIndex]);

  const browsingPlan = !route && !routePreviewPlaying && (geojson?.features.length ?? 0) >= 2;

  const onMapLoad = () => {
    const map = mapRef.current?.getMap?.();
    if (!map) return;

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

    const markReady = () => setMapReady(true);
    if (map.isStyleLoaded()) markReady();
    else map.once("style.load", markReady);

    registerLiveMap(() => mapRef.current?.getMap() ?? map);

    const completeFlyIn = () => useUIStore.getState().setMapFlyInComplete(true);
    const target = LAUNCH_VIEW;
    if (reduced) {
      map.jumpTo({
        center: [target.longitude, target.latitude],
        zoom: target.zoom,
        pitch: target.pitch,
        bearing: target.bearing,
        padding: MAP_PADDING,
      });
      completeFlyIn();
      return;
    }

    window.setTimeout(() => {
      map.flyTo({
        center: [target.longitude, target.latitude],
        zoom: target.zoom,
        pitch: target.pitch,
        bearing: target.bearing,
        padding: MAP_PADDING,
        duration: 3200,
        curve: 1.55,
        speed: 0.72,
        essential: true,
      });
      const onEnd = () => {
        map.off("moveend", onEnd);
        completeFlyIn();
      };
      map.once("moveend", onEnd);
      window.setTimeout(completeFlyIn, 3600);
    }, 120);
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
        initialViewState={reduced ? LAUNCH_VIEW : OPENING_VIEW}
        mapStyle="mapbox://styles/mapbox/standard"
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
        onLoad={onMapLoad}
        antialias
      >
        {mapReady && (
          <>
            <MapLayerErrorBoundary name="route">
              <RouteLineLayer />
            </MapLayerErrorBoundary>
            <RoutePreviewOverlay />
            <ExperienceRoutePreview />
            <MapLayerErrorBoundary name="aqi">
              <AirQualityLayer />
            </MapLayerErrorBoundary>
          </>
        )}
        <MapLayerErrorBoundary name="sun">
          <MapSunLayer />
        </MapLayerErrorBoundary>
        <MapLayerErrorBoundary name="birds">
          <MapSkyBirdsOverlay />
        </MapLayerErrorBoundary>
        <DemoLayers />
        <UserLocationMarker />
        <MapAnnotationMarker />
        <RouteStopMarkers />
        <MapControls />
        <SeasonToggle />
        <AnimatePresence>
          {features.map((f, i) => {
            const [lon, lat] = f.geometry.coordinates as [number, number];
            const id = f.properties.id ?? `${i}-${lon}-${lat}`;
            return (
              <MapMarker key={id} longitude={lon} latitude={lat} anchor="center">
                <ParisMarker
                  feature={f}
                  index={i}
                  planStopNumber={browsingPlan ? i + 1 : undefined}
                  selected={selected?.properties.id === f.properties.id}
                  onClick={() => select(f)}
                />
              </MapMarker>
            );
          })}
        </AnimatePresence>
      </Map>
      <MapFocusVeil />
      <AirQualityLegend />
    </div>
  );
}

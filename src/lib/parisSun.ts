import { getPosition } from "suncalc";
import type { LightPreset } from "@/lib/parisWeather";

const PARIS_LAT = 48.8566;
const PARIS_LON = 2.3522;
const PARIS_TZ = "Europe/Paris";

export interface ParisSunPosition {
  /** Degrees from north, clockwise (Mapbox sky + directional light). */
  azimuth: number;
  /** Degrees from zenith; 90° is the horizon. */
  polar: number;
  /** Degrees above the horizon. */
  elevation: number;
  visible: boolean;
}

/** Instant to use for sun math — live Paris time, or shifted when concierge overrides hour. */
export function getParisInstant(hourOverride: number | null): Date {
  const now = new Date();
  if (hourOverride == null) return now;

  const parisHour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: PARIS_TZ,
      hour: "2-digit",
      hour12: false,
    }).format(now),
  );
  return new Date(now.getTime() + (hourOverride - parisHour) * 3_600_000);
}

export function computeParisSunPosition(hourOverride: number | null): ParisSunPosition {
  const when = getParisInstant(hourOverride);
  const pos = getPosition(when, PARIS_LAT, PARIS_LON);
  // suncalc v2 returns north-based azimuth and altitude in degrees.
  const elevation = pos.altitude;
  const azimuth = pos.azimuth;
  const polar = Math.max(0, Math.min(120, 90 - elevation));

  return {
    azimuth,
    polar,
    elevation,
    visible: elevation > -0.8,
  };
}

export function sunVisualForPreset(preset: LightPreset, sun: ParisSunPosition) {
  if (!sun.visible || preset === "night") {
    return {
      sunIntensity: 0,
      haloColor: "rgb(120, 130, 160)",
      skyTint: "rgb(12, 16, 32)",
      lightColor: "rgb(180, 190, 220)",
      lightIntensity: 0.06,
      ambientIntensity: 0.12,
      castShadows: false,
    };
  }

  if (preset === "dawn") {
    return {
      sunIntensity: 24,
      haloColor: "rgb(255, 170, 110)",
      skyTint: "rgb(255, 210, 180)",
      lightColor: "rgb(255, 190, 140)",
      lightIntensity: 0.42,
      ambientIntensity: 0.28,
      castShadows: sun.elevation > 4,
    };
  }

  if (preset === "dusk") {
    return {
      sunIntensity: 26,
      haloColor: "rgb(255, 150, 90)",
      skyTint: "rgb(255, 190, 160)",
      lightColor: "rgb(255, 170, 120)",
      lightIntensity: 0.38,
      ambientIntensity: 0.24,
      castShadows: sun.elevation > 3,
    };
  }

  return {
    sunIntensity: 30,
    haloColor: "rgb(255, 230, 180)",
    skyTint: "rgb(210, 230, 255)",
    lightColor: "rgb(255, 248, 235)",
    lightIntensity: 0.58,
    ambientIntensity: 0.34,
    castShadows: sun.elevation > 6,
  };
}

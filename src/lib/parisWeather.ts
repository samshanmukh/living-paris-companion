// Live Paris weather + local time → Mapbox Standard "lightPreset" and
// setRain/setSnow parameters. Uses Open-Meteo (no API key, free, CORS-open).

export type LightPreset = "dawn" | "day" | "dusk" | "night";
export type Precip = "none" | "rain" | "snow";

export interface ParisConditions {
  lightPreset: LightPreset;
  precip: Precip;
  intensity: number; // 0..1
  code: number;
  isDay: boolean;
  localHour: number;
  fetchedAt: number;
}

// WMO weather codes → precipitation bucket + intensity (0..1)
// https://open-meteo.com/en/docs (WMO Weather interpretation codes)
function codeToPrecip(code: number): { precip: Precip; intensity: number } {
  // Snow
  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    const heavy = code === 75 || code === 86;
    const light = code === 71 || code === 85;
    return { precip: "snow", intensity: heavy ? 0.95 : light ? 0.35 : 0.65 };
  }
  // Rain / drizzle / showers / thunder
  if (
    [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(
      code,
    )
  ) {
    const heavy = [65, 67, 82, 95, 96, 99].includes(code);
    const light = [51, 56, 61, 66, 80].includes(code);
    return { precip: "rain", intensity: heavy ? 0.95 : light ? 0.35 : 0.65 };
  }
  return { precip: "none", intensity: 0 };
}

function hourToPreset(hour: number, isDay: boolean): LightPreset {
  // Sunrise ~ dawn, sunset ~ dusk. Paris rough bands, tuned for feel.
  if (hour >= 5 && hour < 8) return "dawn";
  if (hour >= 8 && hour < 18) return isDay ? "day" : "dusk";
  if (hour >= 18 && hour < 21) return "dusk";
  return "night";
}

export function presetFromHour(hour: number, isDay = true): LightPreset {
  return hourToPreset(hour, isDay);
}

export type SkyKind = "sun" | "moon" | "sunrise" | "sunset";

export function skyKindFromPreset(preset: LightPreset): SkyKind {
  if (preset === "night") return "moon";
  if (preset === "dawn") return "sunrise";
  if (preset === "dusk") return "sunset";
  return "sun";
}

/** Resolve map light preset from live conditions or concierge hour override. */
export function resolveLightPreset(
  conditions: ParisConditions | null,
  hourOverride: number | null,
): LightPreset {
  if (hourOverride != null) return presetFromHour(hourOverride, hourOverride >= 8 && hourOverride < 18);
  return conditions?.lightPreset ?? "day";
}

export function formatParisTime(date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export async function fetchParisConditions(): Promise<ParisConditions> {
  const url =
    "https://api.open-meteo.com/v1/forecast?latitude=48.8566&longitude=2.3522" +
    "&current=weather_code,is_day&timezone=Europe%2FParis";
  const res = await fetch(url);
  if (!res.ok) throw new Error("weather fetch failed");
  const data = (await res.json()) as {
    current: { weather_code: number; is_day: number; time: string };
  };
  const code = data.current.weather_code;
  const isDay = data.current.is_day === 1;
  // "time" is local ISO like "2026-07-05T22:15"
  const localHour = Number(data.current.time.slice(11, 13));
  const { precip, intensity } = codeToPrecip(code);
  return {
    lightPreset: hourToPreset(localHour, isDay),
    precip,
    intensity,
    code,
    isDay,
    localHour,
    fetchedAt: Date.now(),
  };
}

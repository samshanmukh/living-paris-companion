/** US EPA AQI scale — colors match WAQI / aqicn.org markers. */

export type AqiLevel =
  | "good"
  | "moderate"
  | "unhealthy-sensitive"
  | "unhealthy"
  | "very-unhealthy"
  | "hazardous";

export interface AqiStyle {
  level: AqiLevel;
  label: string;
  color: string;
  glow: string;
}

export function aqiStyle(aqi: number): AqiStyle {
  if (aqi <= 50) {
    return { level: "good", label: "Good", color: "#00E400", glow: "rgba(0, 228, 0, 0.45)" };
  }
  if (aqi <= 100) {
    return { level: "moderate", label: "Moderate", color: "#FFFF00", glow: "rgba(255, 255, 0, 0.4)" };
  }
  if (aqi <= 150) {
    return {
      level: "unhealthy-sensitive",
      label: "Unhealthy for sensitive groups",
      color: "#FF7E00",
      glow: "rgba(255, 126, 0, 0.45)",
    };
  }
  if (aqi <= 200) {
    return { level: "unhealthy", label: "Unhealthy", color: "#FF0000", glow: "rgba(255, 0, 0, 0.45)" };
  }
  if (aqi <= 300) {
    return {
      level: "very-unhealthy",
      label: "Very unhealthy",
      color: "#8F3F97",
      glow: "rgba(143, 63, 151, 0.45)",
    };
  }
  return { level: "hazardous", label: "Hazardous", color: "#7E0023", glow: "rgba(126, 0, 35, 0.5)" };
}

export function pollutantLabel(code?: string | null): string {
  if (!code) return "AQI";
  const map: Record<string, string> = {
    pm25: "PM2.5",
    pm10: "PM10",
    o3: "Ozone",
    no2: "NO₂",
    so2: "SO₂",
    co: "CO",
  };
  return map[code] ?? code.toUpperCase();
}

/** Paris core — stations + tile overlay focus. */
export const PARIS_AQI_BOUNDS = {
  south: 48.80,
  west: 2.20,
  north: 48.92,
  east: 2.50,
  center: { lat: 48.8566, lon: 2.3522 },
} as const;

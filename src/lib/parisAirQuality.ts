import type { AqiStation, ParisAirQualitySnapshot } from "@/lib/types";

export async function fetchParisAirQuality(): Promise<ParisAirQualitySnapshot | null> {
  try {
    const res = await fetch("/api/air-quality");
    if (!res.ok) return null;
    const data = (await res.json()) as ParisAirQualitySnapshot & { error?: boolean };
    if (data.error) return null;
    return data;
  } catch {
    return null;
  }
}

export function tileUrlTemplate(origin = ""): string {
  const base = origin || (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/api/air-quality?tile=1&z={z}&x={x}&y={y}`;
}

export function visibleStations(stations: AqiStation[], zoom: number): AqiStation[] {
  if (zoom >= 13) return stations;
  if (zoom >= 11) return stations.filter((s) => s.aqi >= 80 || s.aqi <= 0).slice(0, 24);
  return stations.filter((s) => s.aqi >= 100).slice(0, 12);
}

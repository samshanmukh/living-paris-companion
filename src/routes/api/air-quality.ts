import { createFileRoute } from "@tanstack/react-router";
import { PARIS_AQI_BOUNDS } from "@/lib/waqi";
import type { AqiStation, ParisAirQualitySnapshot } from "@/lib/types";

const WAQI_ATTRIBUTION = "Air quality data © World Air Quality Index (aqicn.org / waqi.info)";

function waqiToken(): string | null {
  return process.env.WAQI_API_KEY?.trim() || null;
}

type WaqiCityFeed = {
  status: string;
  data?: {
    aqi: number;
    idx: number;
    city?: { name?: string; geo?: [number, number] };
    dominentpol?: string;
    time?: { iso?: string; s?: string };
  };
};

type WaqiBoundsFeed = {
  status: string;
  data?: Array<{
    lat: string | number;
    lon: string | number;
    aqi: string | number;
    idx?: number;
    station?: { name?: string };
  }>;
};

function parseStation(row: NonNullable<WaqiBoundsFeed["data"]>[number], i: number): AqiStation | null {
  const lat = Number(row.lat);
  const lon = Number(row.lon);
  const aqi = Number(row.aqi);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(aqi)) return null;
  return {
    id: row.idx ?? i,
    name: row.station?.name?.trim() || `Station ${i + 1}`,
    lat,
    lon,
    aqi,
  };
}

async function fetchCitySnapshot(token: string): Promise<Partial<ParisAirQualitySnapshot>> {
  const { lat, lon } = PARIS_AQI_BOUNDS.center;
  const url = `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${encodeURIComponent(token)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("city feed failed");
  const json = (await res.json()) as WaqiCityFeed;
  if (json.status !== "ok" || !json.data) throw new Error("city feed empty");
  return {
    cityAqi: json.data.aqi,
    cityName: json.data.city?.name ?? "Paris",
    dominantPol: json.data.dominentpol,
    updatedAt: json.data.time?.iso ?? json.data.time?.s ?? new Date().toISOString(),
  };
}

async function fetchStations(token: string): Promise<AqiStation[]> {
  const { south, west, north, east } = PARIS_AQI_BOUNDS;
  const url =
    `https://api.waqi.info/map/bounds/?latlng=${south},${west},${north},${east}` +
    `&token=${encodeURIComponent(token)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("bounds feed failed");
  const json = (await res.json()) as WaqiBoundsFeed;
  if (json.status !== "ok" || !Array.isArray(json.data)) return [];
  return json.data
    .map((row, i) => parseStation(row, i))
    .filter((s): s is AqiStation => s != null);
}

async function proxyTile(token: string, z: string, x: string, y: string): Promise<Response> {
  const url =
    `https://tiles.waqi.info/tiles/usepa-aqi/${z}/${x}/${y}.png?token=${encodeURIComponent(token)}`;
  const res = await fetch(url);
  if (!res.ok) {
    return new Response(null, { status: res.status === 503 ? 503 : 502 });
  }
  const body = await res.arrayBuffer();
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=900",
      "X-WAQI-Attribution": WAQI_ATTRIBUTION,
    },
  });
}

export const Route = createFileRoute("/api/air-quality")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = waqiToken();
        if (!token) {
          return Response.json({ error: true, reason: "missing WAQI_API_KEY" }, { status: 500 });
        }

        const u = new URL(request.url);
        const z = u.searchParams.get("z");
        const x = u.searchParams.get("x");
        const y = u.searchParams.get("y");
        if (u.searchParams.get("tile") === "1" && z && x && y) {
          return proxyTile(token, z, x, y);
        }

        try {
          const [city, stations] = await Promise.all([
            fetchCitySnapshot(token),
            fetchStations(token),
          ]);
          const payload: ParisAirQualitySnapshot = {
            cityAqi: city.cityAqi ?? 0,
            cityName: city.cityName ?? "Paris",
            dominantPol: city.dominantPol,
            updatedAt: city.updatedAt ?? new Date().toISOString(),
            stations,
            attribution: WAQI_ATTRIBUTION,
          };
          return Response.json(payload, {
            headers: { "Cache-Control": "public, max-age=300" },
          });
        } catch (err) {
          const reason = err instanceof Error ? err.message : "waqi fetch failed";
          return Response.json({ error: true, reason }, { status: 502 });
        }
      },
    },
  },
});

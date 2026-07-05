/** Geocode a place name within Paris (Nominatim, no API key). */
export async function geocodeParis(
  query: string,
): Promise<{ coords: [number, number]; label: string } | null> {
  const q = query.trim();
  if (!q) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q + ", Paris, France")}`;
    const r = await fetch(url, { headers: { Accept: "application/json" } });
    if (!r.ok) return null;
    const data = (await r.json()) as Array<{ lat: string; lon: string; display_name: string }>;
    if (!data.length) return null;
    const label = data[0].display_name.split(",").slice(0, 2).join(", ").trim();
    return { coords: [parseFloat(data[0].lon), parseFloat(data[0].lat)], label };
  } catch {
    return null;
  }
}

/** Browser geolocation → [lon, lat] or null. */
export function geolocateDevice(): Promise<[number, number] | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve([pos.coords.longitude, pos.coords.latitude]),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 },
    );
  });
}

/** Detect if the user is setting their location (not searching for places). */
export function detectLocationCommand(
  raw: string,
): { kind: "geolocate" } | { kind: "geocode"; query: string } | null {
  const t = raw.toLowerCase().trim();

  if (/\b(use my location|my location|where i am|i'?m here|find me|locate me|gps)\b/.test(t)) {
    return { kind: "geolocate" };
  }

  if (/\b(find|plan|somewhere|coffee|food|restaurant|walk|quiet|delicious|route|take me)\b/i.test(raw)) {
    return null;
  }

  const patterns = [
    /\b(?:i'?m|i am|we'?re)\s+(?:at|near|in|by|from)\s+(.+)/i,
    /\b(?:start(?:ing)?|begin)\s+(?:at|from|near)\s+(.+)/i,
    /\b(?:near|at|in)\s+(?:the\s+)?([a-zàâäéèêëïîôùûüç0-9\s'-]{3,50})/i,
  ];

  for (const rx of patterns) {
    const m = raw.match(rx);
    if (m?.[1]) {
      let q = m[1]
        .replace(/\s+(please|today|now|\.|!|\?).*$/i, "")
        .replace(/\s+paris\s*$/i, "")
        .trim();
      if (q.length >= 3 && q.length <= 50) return { kind: "geocode", query: q };
    }
  }

  return null;
}

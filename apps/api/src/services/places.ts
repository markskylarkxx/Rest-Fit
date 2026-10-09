// OpenStreetMap gym lookup via the Overpass API.
// Free, no API key. Requires a User-Agent header (Overpass rejects requests without one).
// Results are cached in-memory for 24h to avoid hammering the API.

interface OSMElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: {
    name?: string;
    "name:en"?: string;
    "addr:street"?: string;
    "addr:city"?: string;
    "addr:full"?: string;
    phone?: string;
    "contact:phone"?: string;
    website?: string;
    opening_hours?: string;
  };
}

export interface PlaceResult {
  id: string;              // "osm:node:123" or "osm:way:456"
  name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  lat: number;
  lng: number;
}

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const USER_AGENT = "RestFit/1.0 (contact: hello@restfit.com)";

// In-memory cache: key = "lat.toFixed(2),lng.toFixed(2),radius", value = { data, expiresAt }
const cache = new Map<string, { data: PlaceResult[]; expiresAt: number }>();
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function cacheKey(lat: number, lng: number, radiusKm: number) {
  // Round to 2 decimals (~1km) so nearby searches share the cache.
  return `${lat.toFixed(2)},${lng.toFixed(2)},${radiusKm}`;
}

// Haversine distance in kilometres.
export function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function pickName(tags: OSMElement["tags"]): string | null {
  if (!tags) return null;
  return tags.name ?? tags["name:en"] ?? null;
}

function pickAddress(tags: OSMElement["tags"]): string | null {
  if (!tags) return null;
  if (tags["addr:full"]) return tags["addr:full"];
  const parts = [tags["addr:street"], tags["addr:city"]].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

function pickPhone(tags: OSMElement["tags"]): string | null {
  if (!tags) return null;
  return tags["contact:phone"] ?? tags.phone ?? null;
}

/**
 * Fetch gyms within `radiusKm` of the given coordinates from OpenStreetMap.
 * Cached for 24 hours per ~1km grid cell.
 */
export async function findNearbyGyms(
  lat: number,
  lng: number,
  radiusKm: number
): Promise<PlaceResult[]> {
  const key = cacheKey(lat, lng, radiusKm);
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const radiusM = Math.round(radiusKm * 1000);
  const query = `[out:json][timeout:25];(node["leisure"="fitness_centre"](around:${radiusM},${lat},${lng});way["leisure"="fitness_centre"](around:${radiusM},${lat},${lng}););out center 50;`;

  const url = `${OVERPASS_URL}?data=${encodeURIComponent(query)}`;

  let elements: OSMElement[] = [];
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok) {
      console.error("Overpass error", res.status);
      return cached?.data ?? [];
    }
    const body = (await res.json()) as { elements?: OSMElement[] };
    elements = body.elements ?? [];
  } catch (err) {
    console.error("Overpass fetch failed", err);
    return cached?.data ?? [];
  }

  const results: PlaceResult[] = [];
  for (const el of elements) {
    const lat2 = el.lat ?? el.center?.lat;
    const lng2 = el.lon ?? el.center?.lon;
    if (lat2 === undefined || lng2 === undefined) continue;

    const name = pickName(el.tags);
    if (!name) continue; // skip unnamed gyms

    results.push({
      id: `osm:${el.type}:${el.id}`,
      name,
      address: pickAddress(el.tags),
      phone: pickPhone(el.tags),
      website: el.tags?.website ?? null,
      lat: lat2,
      lng: lng2,
    });
  }

  cache.set(key, { data: results, expiresAt: Date.now() + TTL_MS });
  return results;
}
/**
 * OSRM Routing Helper
 * Uses the free public OSRM demo server (no API key required).
 * Returns the decoded polyline as [lat, lng] pairs for Leaflet.
 */

export interface OsrmResult {
  /** Leaflet-ready [lat, lng] pairs */
  polyline: [number, number][];
  /** Human-readable distance e.g. "4.2 km" */
  distance: string;
  /** Human-readable duration e.g. "12 min" */
  duration: string;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export async function fetchOsrmRoute(src: LatLng, dst: LatLng): Promise<OsrmResult> {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${src.lng},${src.lat};${dst.lng},${dst.lat}` +
    `?overview=full&geometries=geojson`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM request failed: ${res.status}`);

  const json = await res.json();
  if (json.code !== "Ok" || !json.routes?.length) {
    throw new Error("OSRM returned no routes.");
  }

  const route = json.routes[0];

  // GeoJSON coordinates are [lng, lat] — flip to [lat, lng] for Leaflet
  const polyline: [number, number][] = route.geometry.coordinates.map(
    ([lng, lat]: [number, number]) => [lat, lng]
  );

  const distKm = (route.distance / 1000).toFixed(1);
  const durMin = Math.round(route.duration / 60);

  return {
    polyline,
    distance: `${distKm} km`,
    duration: `${durMin} min`,
  };
}

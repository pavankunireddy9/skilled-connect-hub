/** Great-circle distance between two coordinates, in kilometres. */
export function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export const formatKm = (km: number) =>
  km < 1 ? `${Math.round(km * 1000)} m away` : `${km.toFixed(km < 10 ? 1 : 0)} km away`;

export type Coords = { lat: number; lng: number };

export function hasCoords(v: {
  lat?: number | null;
  lng?: number | null;
}): v is { lat: number; lng: number } {
  return typeof v.lat === "number" && typeof v.lng === "number";
}

/**
 * Match score for a job against a provider's service area.
 * Returns null when the job sits outside the provider's radius.
 */
export function matchScore(opts: {
  distanceKm: number;
  radiusKm: number;
  sameCategory: boolean;
  rating?: number;
}): number | null {
  if (opts.distanceKm > opts.radiusKm) return null;
  const proximity = 1 - opts.distanceKm / Math.max(opts.radiusKm, 1); // 0..1
  const category = opts.sameCategory ? 1 : 0.35;
  const quality = (opts.rating ?? 0) / 5;
  return Math.round((proximity * 0.6 + category * 0.3 + quality * 0.1) * 100);
}

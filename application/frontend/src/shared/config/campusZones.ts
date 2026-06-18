export type CampusZone = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  congestionFactor: number;
};

export const UTS_SYDNEY_CENTER: [number, number] = [-33.8834, 151.2005];

export const CAMPUS_ZONES: CampusZone[] = [
  {
    id: "node-alpha",
    label: "Node Alpha — Main Entrance",
    lat: -33.8834,
    lng: 151.2005,
    congestionFactor: 0.55,
  },
  {
    id: "zone-a4",
    label: "Zone A-4 Congestion",
    lat: -33.8842,
    lng: 151.2018,
    congestionFactor: 1.15,
  },
  {
    id: "dock-shipping",
    label: "Shipping/Dock",
    lat: -33.8825,
    lng: 151.1992,
    congestionFactor: 0.85,
  },
];

export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function pickNearestZoneId(lat: number, lng: number): string {
  let nearest = CAMPUS_ZONES[0];
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const zone of CAMPUS_ZONES) {
    const distance = distanceKm(lat, lng, zone.lat, zone.lng);
    if (distance < bestDistance) {
      bestDistance = distance;
      nearest = zone;
    }
  }
  return nearest.id;
}

export type MapMarker = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  risk: "SAFE" | "WARNING" | "DANGER";
  capacity?: string;
};

export const UTS_SYDNEY_CENTER: [number, number] = [-33.8834, 151.2005];

export const MAP_MARKERS: MapMarker[] = [
  {
    id: "node-alpha",
    label: "Node Alpha — Main Entrance",
    lat: -33.8834,
    lng: 151.2005,
    risk: "SAFE",
    capacity: "42% CAPACITY",
  },
  {
    id: "zone-a4",
    label: "Zone A-4 Congestion",
    lat: -33.8842,
    lng: 151.2018,
    risk: "DANGER",
    capacity: "88% CAPACITY",
  },
  {
    id: "dock-shipping",
    label: "Shipping/Dock",
    lat: -33.8825,
    lng: 151.1992,
    risk: "WARNING",
    capacity: "64% CAPACITY",
  },
];

export function useMapMarkers() {
  return {
    center: UTS_SYDNEY_CENTER,
    zoom: 16,
    markers: MAP_MARKERS,
  };
}

import type { ProximityRisk } from "@/entities/session";

export type MapMarkerKind = "zone" | "user";

export type MapMarker = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  risk: ProximityRisk;
  capacity?: string;
  kind: MapMarkerKind;
  /** True when position or capacity is illustrative, not measured GPS/occupancy. */
  synthetic?: boolean;
};

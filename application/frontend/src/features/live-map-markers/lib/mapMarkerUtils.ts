import type { ProximityRisk, SessionDetailResponse } from "@/entities/session";
import type { MapMarker } from "../model/types";

const RISK_RANK: Record<ProximityRisk, number> = {
  SAFE: 0,
  WARNING: 1,
  DANGER: 2,
};

export type ZoneAnchor = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  congestionFactor: number;
};

export const UTS_SYDNEY_CENTER: [number, number] = [-33.8834, 151.2005];

/** Radius within which fixed zone anchors are considered relevant to the user. */
export const CAMPUS_RADIUS_KM = 2;

export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isNearCampus(
  lat: number,
  lng: number,
  radiusKm: number = CAMPUS_RADIUS_KM,
): boolean {
  const [campusLat, campusLng] = UTS_SYDNEY_CENTER;
  return distanceKm(lat, lng, campusLat, campusLng) <= radiusKm;
}

export const ZONE_ANCHORS: ZoneAnchor[] = [
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

export function maxProximityRisk(risks: Array<ProximityRisk | null | undefined>): ProximityRisk {
  return risks.reduce<ProximityRisk>((best, risk) => {
    if (!risk) return best;
    return RISK_RANK[risk] > RISK_RANK[best] ? risk : best;
  }, "SAFE");
}

export type SessionAggregateMetrics = {
  worstRisk: ProximityRisk;
  capacityPct: number;
  activeCount: number;
  sessionCount: number;
};

export function aggregateSessionMetrics(
  sessions: SessionDetailResponse[],
): SessionAggregateMetrics {
  const withFrames = sessions.filter((session) => session.frame_count > 0);

  if (withFrames.length === 0) {
    return {
      worstRisk: "SAFE",
      capacityPct: 18,
      activeCount: 0,
      sessionCount: sessions.length,
    };
  }

  const activeCount = withFrames.filter((session) => session.ended_at == null).length;
  const worstRisk = maxProximityRisk(withFrames.map((session) => session.worst_risk));
  const avgFrames =
    withFrames.reduce((sum, session) => sum + session.frame_count, 0) / withFrames.length;
  const capacityPct = Math.min(
    99,
    Math.round(avgFrames * 1.4 + activeCount * 18 + (worstRisk === "DANGER" ? 12 : 0)),
  );

  return {
    worstRisk,
    capacityPct,
    activeCount,
    sessionCount: withFrames.length,
  };
}

function riskFromCapacity(capacity: number, floor: ProximityRisk): ProximityRisk {
  if (capacity >= 82) return "DANGER";
  if (capacity >= 55) return maxProximityRisk([floor, "WARNING"]);
  return floor;
}

export function buildZoneMarkers(
  metrics: SessionAggregateMetrics,
  anchors: ZoneAnchor[] = ZONE_ANCHORS,
): MapMarker[] {
  return anchors.map((anchor) => {
    const capacity = Math.min(
      99,
      Math.round(metrics.capacityPct * anchor.congestionFactor),
    );

    return {
      id: anchor.id,
      label: anchor.label,
      lat: anchor.lat,
      lng: anchor.lng,
      risk: riskFromCapacity(capacity, metrics.worstRisk),
      capacity: `${capacity}% CAPACITY`,
      kind: "zone",
    };
  });
}

export function pickActiveSession(
  sessions: SessionDetailResponse[],
): SessionDetailResponse | undefined {
  const active = sessions.filter((session) => session.ended_at == null && session.frame_count > 0);
  if (active.length === 0) return undefined;

  const worst = maxProximityRisk(active.map((session) => session.worst_risk));
  return active.find((session) => session.worst_risk === worst) ?? active[0];
}

export function buildUserMarker(
  lat: number,
  lng: number,
  risk: ProximityRisk,
  label = "Your location",
): MapMarker {
  return {
    id: "user-position",
    label,
    lat,
    lng,
    risk,
    kind: "user",
  };
}

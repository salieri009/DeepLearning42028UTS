import type { ProximityRisk, SessionDetailResponse } from "@/entities/session";
import {
  CAMPUS_ZONES,
  distanceKm,
  type CampusZone,
  UTS_SYDNEY_CENTER,
} from "@/shared/config/campusZones";
import type { MapMarker } from "../model/types";

const RISK_RANK: Record<ProximityRisk, number> = {
  SAFE: 0,
  WARNING: 1,
  DANGER: 2,
};

export type ZoneAnchor = CampusZone;

export { UTS_SYDNEY_CENTER, distanceKm };

/** Radius within which fixed zone anchors are considered relevant to the user. */
export const CAMPUS_RADIUS_KM = 2;

export function isNearCampus(
  lat: number,
  lng: number,
  radiusKm: number = CAMPUS_RADIUS_KM,
): boolean {
  const [campusLat, campusLng] = UTS_SYDNEY_CENTER;
  return distanceKm(lat, lng, campusLat, campusLng) <= radiusKm;
}

export const ZONE_ANCHORS: ZoneAnchor[] = CAMPUS_ZONES;

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
      capacityPct: 0,
      activeCount: 0,
      sessionCount: sessions.length,
    };
  }

  const activeCount = withFrames.filter((session) => session.ended_at == null).length;
  const worstRisk = maxProximityRisk(withFrames.map((session) => session.worst_risk));
  const elevatedCount = withFrames.filter(
    (session) => session.worst_risk === "DANGER" || session.worst_risk === "WARNING",
  ).length;
  const capacityPct = Math.round((elevatedCount / withFrames.length) * 100);

  return {
    worstRisk,
    capacityPct,
    activeCount,
    sessionCount: withFrames.length,
  };
}

function riskFromElevatedRatio(capacityPct: number, floor: ProximityRisk): ProximityRisk {
  if (capacityPct >= 70) return "DANGER";
  if (capacityPct >= 35) return maxProximityRisk([floor, "WARNING"]);
  return floor;
}

export function buildZoneMarkers(
  metrics: SessionAggregateMetrics,
  anchors: ZoneAnchor[] = ZONE_ANCHORS,
): MapMarker[] {
  return anchors.map((anchor) => {
    const capacity = `${metrics.capacityPct}% elevated sessions`;

    return {
      id: anchor.id,
      label: `${anchor.label} (illustrative anchor)`,
      lat: anchor.lat,
      lng: anchor.lng,
      risk: riskFromElevatedRatio(metrics.capacityPct, metrics.worstRisk),
      capacity,
      kind: "zone",
      synthetic: true,
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

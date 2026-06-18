import type { DetectionItem, FrameItem, SessionDetailResponse } from "@/entities/session";

export type SessionExportBundle = {
  exported_at: string;
  session: SessionDetailResponse;
  frames: FrameItem[];
  detections: DetectionItem[];
};

export function buildSessionExportBundle(
  session: SessionDetailResponse,
  frames: FrameItem[],
  detections: DetectionItem[],
): SessionExportBundle {
  return {
    exported_at: new Date().toISOString(),
    session,
    frames,
    detections,
  };
}

export function downloadSessionJson(bundle: SessionExportBundle, filename?: string) {
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename ?? `crowdnav-session-${bundle.session.id}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

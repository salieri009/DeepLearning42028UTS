import {
  buildSessionExportBundle,
  downloadSessionJson,
} from "@/features/session-archive/lib/exportSessionJson";
import {
  confirmTruncatedExport,
  DETECTION_PREVIEW_LIMIT,
  FRAME_PREVIEW_LIMIT,
} from "@/features/session-archive/lib/sessionArchiveUtils";
import { getSession, listDetections, listSessionFrames } from "@/shared/api";
import { reportError } from "@/shared/lib/reportError";

export async function exportLiveSession(sessionId: number): Promise<boolean> {
  try {
    const [session, detectionData, frameData] = await Promise.all([
      getSession(sessionId),
      listDetections(sessionId, { limit: DETECTION_PREVIEW_LIMIT }),
      listSessionFrames(sessionId, FRAME_PREVIEW_LIMIT),
    ]);

    if (!confirmTruncatedExport(session, detectionData.items.length, frameData.items.length)) {
      return false;
    }

    downloadSessionJson(
      buildSessionExportBundle(session, frameData.items, detectionData.items),
    );
    return true;
  } catch (err) {
    reportError("Export session error", err);
    return false;
  }
}

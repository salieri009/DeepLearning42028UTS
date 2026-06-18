import {
  buildSessionExportBundle,
  downloadSessionJson,
} from "@/features/session-archive/lib/exportSessionJson";
import { getSession, listDetections, listSessionFrames } from "@/shared/api";
import { reportError } from "@/shared/lib/reportError";

export async function exportLiveSession(sessionId: number): Promise<boolean> {
  try {
    const [session, detectionData, frameData] = await Promise.all([
      getSession(sessionId),
      listDetections(sessionId, { limit: 500 }),
      listSessionFrames(sessionId, 100),
    ]);
    downloadSessionJson(
      buildSessionExportBundle(session, frameData.items, detectionData.items),
    );
    return true;
  } catch (err) {
    reportError("Export session error", err);
    return false;
  }
}

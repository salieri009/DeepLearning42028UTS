export type ProximityRisk = "SAFE" | "WARNING" | "DANGER";

export type SourceType = "WEBCAM" | "UPLOAD" | "MOCK";

export type SessionResponse = {
  id: number;
  started_at: string;
  ended_at: string | null;
  client_label: string;
  source_type: SourceType;
};

export type SessionDetailResponse = SessionResponse & {
  frame_count: number;
  avg_latency_ms: number | null;
  worst_risk: ProximityRisk | null;
};

export type SessionListResponse = {
  items: SessionResponse[];
  total: number;
};

export type DetectionItem = {
  frame_id: number;
  sequence_no: number;
  captured_at: string;
  class: string;
  confidence: number;
  proximity_risk: ProximityRisk;
  x_center: number;
  y_center: number;
  width: number;
  height: number;
};

export type DetectionListResponse = {
  items: DetectionItem[];
};

export type BBox = {
  x_center: number;
  y_center: number;
  width: number;
  height: number;
};

export type PersonDetection = {
  class: string;
  confidence: number;
  bbox: BBox;
  risk_level?: string;
};

export type AnalyzeFrameResponse = {
  persons?: PersonDetection[];
  crowd_density?: string;
  max_proximity_risk?: string;
  recommendation?: string;
};


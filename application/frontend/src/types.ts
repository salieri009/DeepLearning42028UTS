export type BBox = {
  x_center: number;
  y_center: number;
  width: number;
  height: number;
};

export type ProximityRisk = "SAFE" | "WARNING" | "DANGER";

export type PersonDetection = {
  class: string;
  confidence: number;
  bbox: BBox;
  proximity_risk?: ProximityRisk;
};

export type AnalyzeFrameResponse = {
  persons?: PersonDetection[];
  crowd_density?: string;
  max_proximity_risk?: string;
  recommendation?: string;
};

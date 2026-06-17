export type SensorSource = {
  id: string;
  name: string;
  ip: string;
  feedLabel: string;
  connected: boolean;
};

export type DetectionModel = "yolov8-precise" | "yolov8-nano" | "custom-onnx";

export type SensorSettingsState = {
  model: DetectionModel;
  confidence: number;
  densityLimit: number;
  visualOverlays: boolean;
  audibleAlerts: boolean;
  logErrors: boolean;
  webrtcAccess: boolean;
};

export const DEFAULT_SENSOR_SOURCES: SensorSource[] = [
  {
    id: "cam-north",
    name: "Main Entrance Hub",
    ip: "192.168.1.104",
    feedLabel: "CAM_NORTH_01 // 1080p 60FPS",
    connected: true,
  },
  {
    id: "cam-lobby",
    name: "Elevator Lobby South",
    ip: "192.168.1.108",
    feedLabel: "CAM_LOBBY_04 // 4K 30FPS",
    connected: true,
  },
];

export const DEFAULT_SETTINGS: SensorSettingsState = {
  model: "yolov8-precise",
  confidence: 85,
  densityLimit: 64,
  visualOverlays: true,
  audibleAlerts: false,
  logErrors: false,
  webrtcAccess: true,
};

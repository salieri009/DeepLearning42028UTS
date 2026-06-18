CREATE TABLE app_settings (
    id          INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    payload     JSONB NOT NULL,
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

INSERT INTO app_settings (id, payload)
VALUES (
    1,
    '{
        "model": "yolov8-precise",
        "confidence": 85,
        "density_limit": 64,
        "visual_overlays": true,
        "audible_alerts": false,
        "log_errors": false,
        "webrtc_access": true
    }'::jsonb
);

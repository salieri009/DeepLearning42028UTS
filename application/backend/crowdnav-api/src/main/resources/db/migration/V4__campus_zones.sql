CREATE TABLE campus_zone (
    id      VARCHAR(32) PRIMARY KEY,
    label   VARCHAR(120) NOT NULL,
    lat     NUMERIC(9, 6) NOT NULL,
    lng     NUMERIC(9, 6) NOT NULL
);

INSERT INTO campus_zone (id, label, lat, lng) VALUES
    ('node-alpha', 'Node Alpha — Main Entrance', -33.883400, 151.200500),
    ('zone-a4', 'Zone A-4 Congestion', -33.884200, 151.201800),
    ('dock-shipping', 'Shipping/Dock', -33.882500, 151.199200);

ALTER TABLE analysis_session
    ADD COLUMN zone_id VARCHAR(32) REFERENCES campus_zone (id);

UPDATE analysis_session
SET zone_id = CASE MOD(id, 3)
    WHEN 0 THEN 'node-alpha'
    WHEN 1 THEN 'zone-a4'
    ELSE 'dock-shipping'
END
WHERE zone_id IS NULL;

ALTER TABLE analysis_session
    ALTER COLUMN zone_id SET NOT NULL;

CREATE INDEX idx_analysis_session_zone_id ON analysis_session (zone_id);

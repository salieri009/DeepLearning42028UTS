ALTER TABLE analysis_session
    ADD COLUMN access_token VARCHAR(64);

UPDATE analysis_session
SET access_token = REPLACE(CAST(RANDOM_UUID() AS VARCHAR(64)), '-', '')
WHERE access_token IS NULL;

ALTER TABLE analysis_session
    ALTER COLUMN access_token SET NOT NULL;

CREATE UNIQUE INDEX idx_analysis_session_access_token ON analysis_session (access_token);

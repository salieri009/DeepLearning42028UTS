package com.crowdnav.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Request body for JSON clients (e.g. base64 frame). Mock stage ignores fields.
 */
public record AnalyzeFrameRequest(
		@JsonProperty("frame_base64") String frameBase64,
		@JsonProperty("session_id") Long sessionId
) {
}

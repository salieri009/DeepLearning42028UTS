package com.crowdnav.api.dto.session;

import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonProperty;

public record DetectionItemResponse(
		Long id,
		@JsonProperty("frame_id") Long frameId,
		@JsonProperty("sequence_no") int sequenceNo,
		@JsonProperty("captured_at") Instant capturedAt,
		@JsonProperty("class") String clazz,
		double confidence,
		@JsonProperty("x_center") double xCenter,
		@JsonProperty("y_center") double yCenter,
		double width,
		double height,
		@JsonProperty("proximity_risk") String proximityRisk) {
}

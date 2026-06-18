package com.crowdnav.api.dto.session;

import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonProperty;

public record FrameItemResponse(
		Long id,
		@JsonProperty("sequence_no") int sequenceNo,
		@JsonProperty("captured_at") Instant capturedAt,
		@JsonProperty("latency_ms") Integer latencyMs,
		@JsonProperty("crowd_density") String crowdDensity,
		@JsonProperty("max_proximity_risk") String maxProximityRisk,
		String recommendation,
		@JsonProperty("person_count") int personCount) {
}

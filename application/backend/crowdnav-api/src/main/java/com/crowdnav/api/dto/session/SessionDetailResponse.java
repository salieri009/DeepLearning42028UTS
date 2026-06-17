package com.crowdnav.api.dto.session;

import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonProperty;

public record SessionDetailResponse(
		Long id,
		@JsonProperty("started_at") Instant startedAt,
		@JsonProperty("ended_at") Instant endedAt,
		@JsonProperty("client_label") String clientLabel,
		@JsonProperty("source_type") String sourceType,
		@JsonProperty("frame_count") long frameCount,
		@JsonProperty("avg_latency_ms") Integer avgLatencyMs,
		@JsonProperty("worst_risk") String worstRisk) {
}

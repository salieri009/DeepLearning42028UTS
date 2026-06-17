package com.crowdnav.api.dto.session;

import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonProperty;

public record SessionResponse(
		Long id,
		@JsonProperty("started_at") Instant startedAt,
		@JsonProperty("ended_at") Instant endedAt,
		@JsonProperty("client_label") String clientLabel,
		@JsonProperty("source_type") String sourceType) {
}

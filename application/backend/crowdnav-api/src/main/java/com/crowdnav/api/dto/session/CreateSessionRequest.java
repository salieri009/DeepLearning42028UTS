package com.crowdnav.api.dto.session;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.NotBlank;

public record CreateSessionRequest(
		@JsonProperty("client_label") String clientLabel,
		@NotBlank @JsonProperty("source_type") String sourceType) {
}

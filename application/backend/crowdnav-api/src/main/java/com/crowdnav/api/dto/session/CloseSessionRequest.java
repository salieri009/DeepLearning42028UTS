package com.crowdnav.api.dto.session;

import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonProperty;

public record CloseSessionRequest(@JsonProperty("ended_at") Instant endedAt) {
}

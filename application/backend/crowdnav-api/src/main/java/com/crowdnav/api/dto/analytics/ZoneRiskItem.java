package com.crowdnav.api.dto.analytics;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ZoneRiskItem(
		String name,
		String level,
		int percent,
		@JsonProperty("synthetic") boolean synthetic) {
}

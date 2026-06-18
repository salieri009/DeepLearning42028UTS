package com.crowdnav.api.dto.analytics;

import com.fasterxml.jackson.annotation.JsonProperty;

public record PeakHourItem(
		String label,
		@JsonProperty("height_percent") int heightPercent,
		boolean peak) {
}

package com.crowdnav.api.dto.analytics;

import com.fasterxml.jackson.annotation.JsonProperty;

public record HotspotItem(
		String id,
		String label,
		@JsonProperty("metric_label") String metricLabel,
		String risk,
		String top,
		String left,
		@JsonProperty("synthetic") boolean synthetic) {
}

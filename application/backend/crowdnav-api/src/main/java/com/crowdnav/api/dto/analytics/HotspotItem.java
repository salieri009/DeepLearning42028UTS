package com.crowdnav.api.dto.analytics;

import com.fasterxml.jackson.annotation.JsonProperty;

public record HotspotItem(
		String id,
		String label,
		String capacity,
		String risk,
		String top,
		String left,
		@JsonProperty("synthetic") boolean synthetic) {
}

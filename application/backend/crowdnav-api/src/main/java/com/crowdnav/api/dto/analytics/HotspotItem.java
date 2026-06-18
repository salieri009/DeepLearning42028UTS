package com.crowdnav.api.dto.analytics;

public record HotspotItem(
		String id,
		String label,
		String capacity,
		String risk,
		String top,
		String left) {
}

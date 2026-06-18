package com.crowdnav.api.dto.settings;

import com.fasterxml.jackson.annotation.JsonProperty;

public record SensorSettingsRequest(
		String model,
		int confidence,
		@JsonProperty("density_limit") int densityLimit,
		@JsonProperty("visual_overlays") boolean visualOverlays,
		@JsonProperty("audible_alerts") boolean audibleAlerts,
		@JsonProperty("log_errors") boolean logErrors,
		@JsonProperty("webrtc_access") boolean webrtcAccess) {
}

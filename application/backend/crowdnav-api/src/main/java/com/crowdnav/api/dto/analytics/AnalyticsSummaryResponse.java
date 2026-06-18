package com.crowdnav.api.dto.analytics;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

public record AnalyticsSummaryResponse(
		@JsonProperty("safety_score") int safetyScore,
		@JsonProperty("safety_label") String safetyLabel,
		@JsonProperty("trend_percent") double trendPercent,
		@JsonProperty("event_count") int eventCount,
		@JsonProperty("busiest_window") String busiestWindow,
		@JsonProperty("peak_hours") List<PeakHourItem> peakHours,
		@JsonProperty("zone_risks") List<ZoneRiskItem> zoneRisks,
		List<HotspotItem> hotspots,
		@JsonProperty("frame_count") long frameCount,
		@JsonProperty("session_count") long sessionCount) {
}

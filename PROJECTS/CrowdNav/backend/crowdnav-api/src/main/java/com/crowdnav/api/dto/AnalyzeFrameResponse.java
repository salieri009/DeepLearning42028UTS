package com.crowdnav.api.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Public API shape aligned with {@code PROJECTS/TechSpec.md} §7.
 */
public record AnalyzeFrameResponse(
		List<PersonDetection> persons,
		@JsonProperty("crowd_density") String crowdDensity,
		@JsonProperty("max_proximity_risk") String maxProximityRisk,
		String recommendation
) {
}

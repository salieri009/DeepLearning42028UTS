package com.crowdnav.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record PersonDetection(
		@JsonProperty("class") String clazz,
		double confidence,
		BBox bbox,
		@JsonProperty("proximity_risk") String proximityRisk
) {
}

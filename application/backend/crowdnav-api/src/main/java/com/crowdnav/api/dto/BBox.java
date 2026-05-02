package com.crowdnav.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Normalized YOLO-style box in [0, 1] relative to frame width/height.
 */
public record BBox(
		@JsonProperty("x_center") double xCenter,
		@JsonProperty("y_center") double yCenter,
		double width,
		double height
) {
}

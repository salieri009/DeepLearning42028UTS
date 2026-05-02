package com.crowdnav.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Request body for JSON clients (base64-encoded frame). Required when {@code app.inference.mode=onnx}.
 */
public record AnalyzeFrameRequest(
		@JsonProperty("frame_base64") String frameBase64
) {
}

package com.crowdnav.api.dto.session;

import java.util.List;

public record DetectionListResponse(
		List<DetectionItemResponse> items) {
}

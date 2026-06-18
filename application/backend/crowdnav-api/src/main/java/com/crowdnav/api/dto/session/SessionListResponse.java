package com.crowdnav.api.dto.session;

import java.util.List;

public record SessionListResponse(
		List<SessionDetailResponse> items,
		long total) {
}

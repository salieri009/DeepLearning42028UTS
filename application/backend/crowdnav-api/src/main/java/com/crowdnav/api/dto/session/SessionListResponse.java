package com.crowdnav.api.dto.session;

import java.util.List;

public record SessionListResponse(
		List<SessionResponse> items,
		long total) {
}

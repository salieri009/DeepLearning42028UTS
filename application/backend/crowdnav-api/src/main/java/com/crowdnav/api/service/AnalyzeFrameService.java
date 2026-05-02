package com.crowdnav.api.service;

import org.springframework.lang.Nullable;

import com.crowdnav.api.dto.AnalyzeFrameResponse;

public interface AnalyzeFrameService {

	/**
	 * @param imageBytes raw image bytes (JPEG/PNG); may be null for mock mode
	 * @param contentType optional MIME type from multipart upload
	 */
	AnalyzeFrameResponse analyzeFrame(@Nullable byte[] imageBytes, @Nullable String contentType);
}

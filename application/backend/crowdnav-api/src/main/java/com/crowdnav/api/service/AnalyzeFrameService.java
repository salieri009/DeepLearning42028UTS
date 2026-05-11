package com.crowdnav.api.service;

import org.springframework.lang.Nullable;

import com.crowdnav.api.dto.AnalyzeFrameResponse;

public interface AnalyzeFrameService {

	AnalyzeFrameResponse analyzeFrame(@Nullable byte[] imageBytes, @Nullable String contentType);
}

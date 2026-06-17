package com.crowdnav.api.service;

import com.crowdnav.api.dto.AnalyzeFrameResponse;

public interface AnalyzeFrameService {

	AnalyzeFrameResponse analyzeFrame(String frameBase64, Long sessionId);

	default AnalyzeFrameResponse analyzeFrame(String frameBase64) {
		return analyzeFrame(frameBase64, null);
	}
}

package com.crowdnav.api.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.crowdnav.api.dto.AnalyzeFrameResponse;
import com.crowdnav.api.service.AnalyzeFrameService;

@RestController
@RequestMapping("/api/v1")
public class AnalyzeFrameController {

	private final AnalyzeFrameService analyzeFrameService;

	public AnalyzeFrameController(AnalyzeFrameService analyzeFrameService) {
		this.analyzeFrameService = analyzeFrameService;
	}

	/**
	 * {@code POST /api/v1/analyze-frame} — mock stage ignores body; later accepts image/base64.
	 */
	@PostMapping("/analyze-frame")
	public AnalyzeFrameResponse analyzeFrame() {
		return analyzeFrameService.analyzeFrame();
	}
}

package com.crowdnav.api.controller;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.crowdnav.api.dto.AnalyzeFrameRequest;
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
	 * JSON body with optional {@code frame_base64}. Frame is forwarded to the inference service.
	 */
	@PostMapping(path = "/analyze-frame", consumes = MediaType.APPLICATION_JSON_VALUE)
	public AnalyzeFrameResponse analyzeFrameJson(@RequestBody(required = false) AnalyzeFrameRequest request) {
		String frame = request != null ? request.frameBase64() : null;
		return analyzeFrameService.analyzeFrame(frame);
	}

	/**
	 * Multipart upload — frame forwarded as null (mock-compatible; remote mode not supported via multipart).
	 */
	@PostMapping(path = "/analyze-frame", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public AnalyzeFrameResponse analyzeFrameMultipart(@RequestPart(value = "image", required = false) MultipartFile image) {
		return analyzeFrameService.analyzeFrame(null);
	}
}

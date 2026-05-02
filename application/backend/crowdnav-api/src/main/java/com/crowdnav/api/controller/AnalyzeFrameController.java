package com.crowdnav.api.controller;

import java.util.Base64;

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
	 * JSON body (optional {@code frame_base64}). Mock stage ignores payload.
	 */
	@PostMapping(path = "/analyze-frame", consumes = MediaType.APPLICATION_JSON_VALUE)
	public AnalyzeFrameResponse analyzeFrameJson(@RequestBody(required = false) AnalyzeFrameRequest request) {
		byte[] bytes = null;
		if (request != null && request.frameBase64() != null && !request.frameBase64().isBlank()) {
			bytes = Base64.getDecoder().decode(request.frameBase64());
		}
		return analyzeFrameService.analyzeFrame(bytes, MediaType.APPLICATION_OCTET_STREAM_VALUE);
	}

	/**
	 * Multipart upload (optional {@code image} part).
	 */
	@PostMapping(path = "/analyze-frame", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public AnalyzeFrameResponse analyzeFrameMultipart(@RequestPart(value = "image", required = false) MultipartFile image)
			throws java.io.IOException {
		byte[] bytes = null;
		String ct = null;
		if (image != null && !image.isEmpty()) {
			bytes = image.getBytes();
			ct = image.getContentType();
		}
		return analyzeFrameService.analyzeFrame(bytes, ct);
	}
}

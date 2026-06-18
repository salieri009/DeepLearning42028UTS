package com.crowdnav.api.controller;

import java.io.IOException;
import java.util.Base64;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.crowdnav.api.dto.AnalyzeFrameRequest;
import com.crowdnav.api.dto.AnalyzeFrameResponse;
import com.crowdnav.api.service.AnalyzeFrameService;
import com.crowdnav.api.service.SessionService;

@RestController
@RequestMapping("/api/v1")
public class AnalyzeFrameController {

	private final AnalyzeFrameService analyzeFrameService;
	private final SessionService sessionService;

	public AnalyzeFrameController(AnalyzeFrameService analyzeFrameService, SessionService sessionService) {
		this.analyzeFrameService = analyzeFrameService;
		this.sessionService = sessionService;
	}

	/**
	 * JSON body: {@code frame_base64} is a base64-encoded JPEG/PNG frame.
	 */
	@PostMapping(path = "/analyze-frame", consumes = MediaType.APPLICATION_JSON_VALUE)
	public AnalyzeFrameResponse analyzeFrameJson(@RequestBody(required = false) AnalyzeFrameRequest request) {
		if (request == null || request.frameBase64() == null || request.frameBase64().isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "frame_base64 is required");
		}
		try {
			Base64.getDecoder().decode(request.frameBase64());
		} catch (IllegalArgumentException e) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid base64 in frame_base64");
		}
		if (request.sessionId() != null) {
			sessionService.requireSessionOpen(request.sessionId());
		}
		return analyzeFrameService.analyzeFrame(request.frameBase64(), request.sessionId());
	}

	/**
	 * Multipart upload: {@code image} part is encoded to base64 and forwarded to the service.
	 * When no image is provided, forwards null (mock returns a fixed response; remote mode returns 400).
	 */
	@PostMapping(path = "/analyze-frame", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public AnalyzeFrameResponse analyzeFrameMultipart(
			@RequestPart(value = "image", required = false) MultipartFile image,
			@RequestParam(value = "session_id", required = false) Long sessionId) {
		String frameBase64 = null;
		if (image != null && !image.isEmpty()) {
			try {
				frameBase64 = Base64.getEncoder().encodeToString(image.getBytes());
			} catch (IOException e) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to read uploaded image");
			}
		}
		if (sessionId != null) {
			sessionService.requireSessionOpen(sessionId);
		}
		return analyzeFrameService.analyzeFrame(frameBase64, sessionId);
	}
}


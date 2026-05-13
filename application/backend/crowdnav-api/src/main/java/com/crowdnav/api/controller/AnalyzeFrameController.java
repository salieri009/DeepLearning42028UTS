package com.crowdnav.api.controller;

import java.io.IOException;
import java.util.Base64;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

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
		return analyzeFrameService.analyzeFrame(request.frameBase64());
	}

	/**
	 * Multipart upload: {@code image} part is encoded to base64 and forwarded to the service.
	 */
	@PostMapping(path = "/analyze-frame", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public AnalyzeFrameResponse analyzeFrameMultipart(@RequestPart(value = "image", required = false) MultipartFile image) {
		String frameBase64 = null;
		if (image != null && !image.isEmpty()) {
			try {
				frameBase64 = Base64.getEncoder().encodeToString(image.getBytes());
			} catch (IOException e) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to read uploaded image");
			}
		}
		return analyzeFrameService.analyzeFrame(frameBase64);
	}
}

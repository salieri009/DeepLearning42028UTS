package com.crowdnav.api.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.crowdnav.api.config.SessionAuthProperties;
import com.crowdnav.api.dto.session.CloseSessionRequest;
import com.crowdnav.api.dto.session.CreateSessionRequest;
import com.crowdnav.api.dto.session.DetectionListResponse;
import com.crowdnav.api.dto.session.FrameListResponse;
import com.crowdnav.api.dto.session.SessionDetailResponse;
import com.crowdnav.api.dto.session.SessionListResponse;
import com.crowdnav.api.dto.session.SessionResponse;
import com.crowdnav.api.service.SessionService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/sessions")
public class SessionController {

	private final SessionService sessionService;

	public SessionController(SessionService sessionService) {
		this.sessionService = sessionService;
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public SessionResponse createSession(@Valid @RequestBody CreateSessionRequest request) {
		return sessionService.createSession(request);
	}

	@GetMapping
	public SessionListResponse listSessions(
			@RequestParam(defaultValue = "20") int limit,
			@RequestParam(defaultValue = "0") int offset,
			@RequestParam(required = false) Integer days,
			@RequestParam(name = "source_type", required = false) String sourceType,
			@RequestParam(name = "worst_risk", required = false) String worstRisk) {
		return sessionService.listSessions(limit, offset, days, sourceType, worstRisk);
	}

	@GetMapping("/{id}")
	public SessionDetailResponse getSession(
			@PathVariable Long id,
			@RequestHeader(value = SessionAuthProperties.ACCESS_TOKEN_HEADER, required = false) String accessToken) {
		return sessionService.getSession(id, accessToken);
	}

	@PatchMapping("/{id}")
	public SessionResponse closeSession(
			@PathVariable Long id,
			@RequestHeader(value = SessionAuthProperties.ACCESS_TOKEN_HEADER, required = false) String accessToken,
			@RequestBody(required = false) CloseSessionRequest request) {
		return sessionService.closeSession(id, accessToken, request);
	}

	@GetMapping("/{id}/detections")
	public DetectionListResponse listDetections(
			@PathVariable Long id,
			@RequestHeader(value = SessionAuthProperties.ACCESS_TOKEN_HEADER, required = false) String accessToken,
			@RequestParam(required = false) String risk,
			@RequestParam(name = "class", required = false) String classLabel,
			@RequestParam(defaultValue = "100") int limit) {
		return sessionService.listDetections(id, accessToken, risk, classLabel, limit);
	}

	@GetMapping("/{id}/frames")
	public FrameListResponse listFrames(
			@PathVariable Long id,
			@RequestHeader(value = SessionAuthProperties.ACCESS_TOKEN_HEADER, required = false) String accessToken,
			@RequestParam(defaultValue = "100") int limit) {
		return sessionService.listFrames(id, accessToken, limit);
	}
}

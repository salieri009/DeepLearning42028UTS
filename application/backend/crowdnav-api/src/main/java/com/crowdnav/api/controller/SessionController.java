package com.crowdnav.api.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.crowdnav.api.dto.session.CloseSessionRequest;
import com.crowdnav.api.dto.session.CreateSessionRequest;
import com.crowdnav.api.dto.session.DetectionListResponse;
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
			@RequestParam(defaultValue = "0") int offset) {
		return sessionService.listSessions(limit, offset);
	}

	@GetMapping("/{id}")
	public SessionDetailResponse getSession(@PathVariable Long id) {
		return sessionService.getSession(id);
	}

	@PatchMapping("/{id}")
	public SessionResponse closeSession(
			@PathVariable Long id,
			@RequestBody(required = false) CloseSessionRequest request) {
		return sessionService.closeSession(id, request);
	}

	@GetMapping("/{id}/detections")
	public DetectionListResponse listDetections(
			@PathVariable Long id,
			@RequestParam(required = false) String risk,
			@RequestParam(name = "class", required = false) String classLabel,
			@RequestParam(defaultValue = "100") int limit) {
		return sessionService.listDetections(id, risk, classLabel, limit);
	}
}

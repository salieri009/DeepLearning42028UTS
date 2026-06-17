package com.crowdnav.api.service;

import java.time.Instant;
import java.util.List;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.crowdnav.api.dto.session.CloseSessionRequest;
import com.crowdnav.api.dto.session.CreateSessionRequest;
import com.crowdnav.api.dto.session.DetectionItemResponse;
import com.crowdnav.api.dto.session.DetectionListResponse;
import com.crowdnav.api.dto.session.SessionDetailResponse;
import com.crowdnav.api.dto.session.SessionListResponse;
import com.crowdnav.api.dto.session.SessionResponse;
import com.crowdnav.api.persistence.entity.AnalysisSession;
import com.crowdnav.api.persistence.entity.Detection;
import com.crowdnav.api.persistence.entity.SourceType;
import com.crowdnav.api.persistence.mapper.PersistenceMapper;
import com.crowdnav.api.persistence.repository.AnalysisSessionRepository;
import com.crowdnav.api.persistence.repository.DetectionRepository;
import com.crowdnav.api.persistence.repository.FrameRepository;

@Service
@Transactional(readOnly = true)
public class SessionService {

	private static final Set<String> VALID_RISKS = Set.of("SAFE", "WARNING", "DANGER");
	private static final Set<String> VALID_CLASSES = Set.of("person", "wheelchair", "luggage");

	private final AnalysisSessionRepository sessionRepository;
	private final FrameRepository frameRepository;
	private final DetectionRepository detectionRepository;

	public SessionService(
			AnalysisSessionRepository sessionRepository,
			FrameRepository frameRepository,
			DetectionRepository detectionRepository) {
		this.sessionRepository = sessionRepository;
		this.frameRepository = frameRepository;
		this.detectionRepository = detectionRepository;
	}

	@Transactional
	public SessionResponse createSession(CreateSessionRequest request) {
		SourceType sourceType;
		try {
			sourceType = PersistenceMapper.parseSourceType(request.sourceType());
		} catch (IllegalArgumentException ex) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid source_type: " + request.sourceType());
		}

		AnalysisSession session = sessionRepository.save(new AnalysisSession(
				Instant.now(),
				request.clientLabel(),
				sourceType));
		return toSessionResponse(session);
	}

	public SessionListResponse listSessions(int limit, int offset) {
		int safeLimit = Math.clamp(limit, 1, 100);
		int safeOffset = Math.max(offset, 0);
		List<SessionResponse> items = sessionRepository.findSlice(safeLimit, safeOffset).stream()
				.map(this::toSessionResponse)
				.toList();
		return new SessionListResponse(items, sessionRepository.count());
	}

	public SessionDetailResponse getSession(Long id) {
		AnalysisSession session = sessionRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));

		long frameCount = frameRepository.countBySessionId(id);
		Double avgLatency = frameRepository.findAvgLatencyMsBySessionId(id);
		String worstRisk = PersistenceMapper.worstRisk(frameRepository.findMaxProximityRisksBySessionId(id));

		return new SessionDetailResponse(
				session.getId(),
				session.getStartedAt(),
				session.getEndedAt(),
				session.getClientLabel(),
				session.getSourceType().name(),
				frameCount,
				avgLatency != null ? (int) Math.round(avgLatency) : null,
				worstRisk);
	}

	public DetectionListResponse listDetections(Long sessionId, String risk, String classLabel, int limit) {
		if (!sessionRepository.existsById(sessionId)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found");
		}

		validateRiskFilter(risk);
		validateClassFilter(classLabel);

		int safeLimit = Math.clamp(limit, 1, 500);
		List<Detection> detections = detectionRepository.findBySessionIdFiltered(sessionId, risk, classLabel);
		List<DetectionItemResponse> items = detections.stream()
				.limit(safeLimit)
				.map(this::toDetectionItem)
				.toList();
		return new DetectionListResponse(items);
	}

	@Transactional
	public SessionResponse closeSession(Long id, CloseSessionRequest request) {
		AnalysisSession session = sessionRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));

		if (session.getEndedAt() != null) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Session already closed");
		}

		Instant endedAt = request != null && request.endedAt() != null ? request.endedAt() : Instant.now();
		session.setEndedAt(endedAt);
		return toSessionResponse(session);
	}

	public void requireSessionExists(Long sessionId) {
		if (!sessionRepository.existsById(sessionId)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found");
		}
	}

	private void validateRiskFilter(String risk) {
		if (risk != null && !VALID_RISKS.contains(risk)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid risk filter: " + risk);
		}
	}

	private void validateClassFilter(String classLabel) {
		if (classLabel != null && !VALID_CLASSES.contains(classLabel)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid class filter: " + classLabel);
		}
	}

	private SessionResponse toSessionResponse(AnalysisSession session) {
		return new SessionResponse(
				session.getId(),
				session.getStartedAt(),
				session.getEndedAt(),
				session.getClientLabel(),
				session.getSourceType().name());
	}

	private DetectionItemResponse toDetectionItem(Detection detection) {
		var frame = detection.getFrame();
		var bbox = detection.getBbox();
		return new DetectionItemResponse(
				detection.getId(),
				frame.getId(),
				frame.getSequenceNo(),
				frame.getCapturedAt(),
				detection.getClassLabel(),
				detection.getConfidence().doubleValue(),
				bbox.getXCenter(),
				bbox.getYCenter(),
				bbox.getWidth(),
				bbox.getHeight(),
				detection.getProximityRisk());
	}
}

package com.crowdnav.api.service;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.time.temporal.ChronoUnit;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.crowdnav.api.config.SessionAuthProperties;
import com.crowdnav.api.dto.session.CloseSessionRequest;
import com.crowdnav.api.dto.session.CreateSessionRequest;
import com.crowdnav.api.dto.session.DetectionItemResponse;
import com.crowdnav.api.dto.session.DetectionListResponse;
import com.crowdnav.api.dto.session.FrameItemResponse;
import com.crowdnav.api.dto.session.FrameListResponse;
import com.crowdnav.api.dto.session.SessionDetailResponse;
import com.crowdnav.api.dto.session.SessionListResponse;
import com.crowdnav.api.dto.session.SessionResponse;
import com.crowdnav.api.persistence.entity.AnalysisSession;
import com.crowdnav.api.persistence.entity.CampusZone;
import com.crowdnav.api.persistence.entity.Detection;
import com.crowdnav.api.persistence.entity.Frame;
import com.crowdnav.api.persistence.entity.SourceType;
import com.crowdnav.api.persistence.mapper.PersistenceMapper;
import com.crowdnav.api.persistence.repository.AnalysisSessionRepository;
import com.crowdnav.api.persistence.repository.CampusZoneRepository;
import com.crowdnav.api.persistence.repository.DetectionRepository;
import com.crowdnav.api.persistence.repository.FrameRepository;

@Service
@Transactional(readOnly = true)
public class SessionService {

	private static final Set<String> VALID_RISKS = Set.of("SAFE", "WARNING", "DANGER");
	private static final Set<String> VALID_CLASSES = Set.of("person", "wheelchair", "luggage");
	private static final Instant ALL_TIME_START = Instant.EPOCH;
	private static final String NO_FILTER = "";
	private static final String DEFAULT_ZONE_ID = "node-alpha";

	private final AnalysisSessionRepository sessionRepository;
	private final FrameRepository frameRepository;
	private final DetectionRepository detectionRepository;
	private final SessionAuthProperties sessionAuth;
	private final CampusZoneRepository zoneRepository;

	public SessionService(
			AnalysisSessionRepository sessionRepository,
			FrameRepository frameRepository,
			DetectionRepository detectionRepository,
			SessionAuthProperties sessionAuth,
			CampusZoneRepository zoneRepository) {
		this.sessionRepository = sessionRepository;
		this.frameRepository = frameRepository;
		this.detectionRepository = detectionRepository;
		this.sessionAuth = sessionAuth;
		this.zoneRepository = zoneRepository;
	}

	@Transactional
	public SessionResponse createSession(CreateSessionRequest request) {
		SourceType sourceType;
		try {
			sourceType = PersistenceMapper.parseSourceType(request.sourceType());
		} catch (IllegalArgumentException ex) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid source_type: " + request.sourceType());
		}

		CampusZone zone = resolveZone(request.zoneId());

		AnalysisSession session = sessionRepository.save(new AnalysisSession(
				Instant.now(),
				request.clientLabel(),
				sourceType,
				zone));
		return toSessionResponse(session, true);
	}

	private CampusZone resolveZone(String zoneId) {
		String safeZoneId = zoneId == null || zoneId.isBlank() ? DEFAULT_ZONE_ID : zoneId;
		return zoneRepository.findById(safeZoneId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid zone_id: " + safeZoneId));
	}

	public SessionListResponse listSessions(
			int limit,
			int offset,
			Integer days,
			String sourceType,
			String worstRisk) {
		int safeLimit = Math.clamp(limit, 1, 100);
		int safeOffset = Math.max(offset, 0);
		Instant startedAfter = daysToStartedAfter(days);
		String safeSource = normalizeSourceFilter(sourceType);
		String safeRisk = normalizeWorstRiskFilter(worstRisk);

		List<SessionDetailResponse> items = sessionRepository
				.findFilteredSummaryRows(startedAfter, safeSource, safeRisk, safeLimit, safeOffset)
				.stream()
				.map(this::toSessionDetail)
				.toList();
		long total = sessionRepository.countFilteredSummaries(startedAfter, safeSource, safeRisk);
		return new SessionListResponse(items, total);
	}

	public SessionDetailResponse getSession(Long id, String accessToken) {
		validateSessionAccess(id, accessToken);
		List<Object[]> rows = sessionRepository.findSessionSummaryRowsById(id);
		if (rows.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found");
		}
		return toSessionDetail(rows.get(0));
	}

	public DetectionListResponse listDetections(
			Long sessionId, String accessToken, String risk, String classLabel, int limit) {
		validateSessionAccess(sessionId, accessToken);

		validateRiskFilter(risk);
		validateClassFilter(classLabel);

		int safeLimit = Math.clamp(limit, 1, 500);
		List<Detection> detections = detectionRepository.findBySessionIdFiltered(
				sessionId, risk, classLabel, PageRequest.of(0, safeLimit));
		List<DetectionItemResponse> items = detections.stream()
				.map(this::toDetectionItem)
				.toList();
		return new DetectionListResponse(items);
	}

	public FrameListResponse listFrames(Long sessionId, String accessToken, int limit) {
		validateSessionAccess(sessionId, accessToken);

		int safeLimit = Math.clamp(limit, 1, 500);
		List<FrameItemResponse> items = frameRepository
				.findBySessionIdOrderBySequenceNoAsc(sessionId, PageRequest.of(0, safeLimit))
				.stream()
				.map(this::toFrameItem)
				.toList();
		return new FrameListResponse(items);
	}

	@Transactional
	public SessionResponse closeSession(Long id, String accessToken, CloseSessionRequest request) {
		AnalysisSession session = loadSessionForAccess(id, accessToken);

		if (session.getEndedAt() != null) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Session already closed");
		}

		Instant endedAt = request != null && request.endedAt() != null ? request.endedAt() : Instant.now();
		session.setEndedAt(endedAt);
		return toSessionResponse(session, false);
	}

	public void validateSessionAccess(Long sessionId, String accessToken) {
		if (!sessionAuth.requireAccessToken()) {
			requireSessionExists(sessionId);
			return;
		}
		loadSessionForAccess(sessionId, accessToken);
	}

	public void requireSessionOpen(Long sessionId, String accessToken) {
		AnalysisSession session = loadSessionForAccess(sessionId, accessToken);
		if (session.getEndedAt() != null) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Session already closed");
		}
	}

	private AnalysisSession loadSessionForAccess(Long sessionId, String accessToken) {
		AnalysisSession session = sessionRepository.findById(sessionId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));
		if (sessionAuth.requireAccessToken()) {
			if (accessToken == null || accessToken.isBlank()) {
				throw new ResponseStatusException(HttpStatus.FORBIDDEN, "X-Session-Token header is required");
			}
			if (!session.getAccessToken().equals(accessToken)) {
				throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Invalid session access token");
			}
		}
		return session;
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

	private Instant daysToStartedAfter(Integer days) {
		if (days == null) {
			return ALL_TIME_START;
		}
		int safeDays = Math.clamp(days, 1, 365);
		return Instant.now().minus(safeDays, ChronoUnit.DAYS);
	}

	private String normalizeSourceFilter(String sourceType) {
		if (sourceType == null || sourceType.isBlank() || "ALL".equalsIgnoreCase(sourceType)) {
			return NO_FILTER;
		}
		try {
			return PersistenceMapper.parseSourceType(sourceType).name();
		} catch (IllegalArgumentException ex) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid source_type filter: " + sourceType);
		}
	}

	private String normalizeWorstRiskFilter(String worstRisk) {
		if (worstRisk == null || worstRisk.isBlank() || "ALL".equalsIgnoreCase(worstRisk)) {
			return NO_FILTER;
		}
		validateRiskFilter(worstRisk);
		return worstRisk;
	}

	private SessionDetailResponse toSessionDetail(Object[] row) {
		Long id = ((Number) row[0]).longValue();
		Instant startedAt = toInstant(row[1]);
		Instant endedAt = row[2] != null ? toInstant(row[2]) : null;
		String clientLabel = row[3] != null ? row[3].toString() : null;
		String sourceType = row[4].toString();
		long frameCount = row[5] != null ? ((Number) row[5]).longValue() : 0L;
		Double avgLatencyMs = row[6] != null ? ((Number) row[6]).doubleValue() : null;
		long danger = row[7] != null ? ((Number) row[7]).longValue() : 0L;
		long warning = row[8] != null ? ((Number) row[8]).longValue() : 0L;

		String worstRisk;
		if (danger > 0) {
			worstRisk = "DANGER";
		} else if (warning > 0) {
			worstRisk = "WARNING";
		} else {
			worstRisk = "SAFE";
		}

		Integer avgLatency = avgLatencyMs != null ? (int) Math.round(avgLatencyMs) : null;

		return new SessionDetailResponse(
				id,
				startedAt,
				endedAt,
				clientLabel,
				sourceType,
				frameCount,
				avgLatency,
				worstRisk);
	}

	private Instant toInstant(Object value) {
		if (value instanceof Instant instant) {
			return instant;
		}
		if (value instanceof java.sql.Timestamp timestamp) {
			return timestamp.toInstant();
		}
		if (value instanceof java.time.LocalDateTime localDateTime) {
			return localDateTime.atZone(java.time.ZoneId.systemDefault()).toInstant();
		}
		if (value instanceof java.time.OffsetDateTime offsetDateTime) {
			return offsetDateTime.toInstant();
		}
		throw new IllegalArgumentException("Unsupported timestamp type: " + value.getClass());
	}

	private SessionResponse toSessionResponse(AnalysisSession session, boolean includeAccessToken) {
		return new SessionResponse(
				session.getId(),
				session.getStartedAt(),
				session.getEndedAt(),
				session.getClientLabel(),
				session.getSourceType().name(),
				includeAccessToken ? session.getAccessToken() : null);
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

	private FrameItemResponse toFrameItem(Frame frame) {
		return new FrameItemResponse(
				frame.getId(),
				frame.getSequenceNo(),
				frame.getCapturedAt(),
				frame.getLatencyMs(),
				frame.getCrowdDensity(),
				frame.getMaxProximityRisk(),
				frame.getRecommendation(),
				frame.getPersonCount());
	}
}


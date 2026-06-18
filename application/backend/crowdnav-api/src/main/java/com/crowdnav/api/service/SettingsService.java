package com.crowdnav.api.service;

import java.time.Duration;
import java.time.Instant;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.crowdnav.api.dto.settings.SensorSettingsRequest;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import com.crowdnav.api.persistence.entity.AppSettings;
import com.crowdnav.api.persistence.repository.AppSettingsRepository;

@Service
@Transactional(readOnly = true)
public class SettingsService {

	private static final int SETTINGS_ID = 1;
	private static final Set<String> VALID_MODELS = Set.of("yolov8-precise", "yolov8-nano");
	private static final Duration SETTINGS_CACHE_TTL = Duration.ofSeconds(5);

	private final AppSettingsRepository settingsRepository;
	private final ObjectMapper objectMapper;
	private volatile SensorSettingsRequest cachedSettings;
	private volatile Instant cachedAt;

	public SettingsService(AppSettingsRepository settingsRepository, ObjectMapper objectMapper) {
		this.settingsRepository = settingsRepository;
		this.objectMapper = objectMapper;
	}

	public SensorSettingsRequest getSettings() {
		SensorSettingsRequest hit = cachedSettings;
		Instant at = cachedAt;
		if (hit != null && at != null && at.plus(SETTINGS_CACHE_TTL).isAfter(Instant.now())) {
			return hit;
		}
		SensorSettingsRequest fresh = readSettings(requireRow());
		cachedSettings = fresh;
		cachedAt = Instant.now();
		return fresh;
	}

	@Transactional
	public SensorSettingsRequest updateSettings(SensorSettingsRequest request) {
		validate(request);
		SensorSettingsRequest normalized = normalize(request);
		AppSettings row = requireRow();
		row.setPayload(writePayload(normalized));
		row.setUpdatedAt(Instant.now());
		invalidateCache();
		return readSettings(row);
	}

	private void invalidateCache() {
		cachedSettings = null;
		cachedAt = null;
	}

	/** PRD §9: audio alerts out of scope — forced off. Other fields persist as submitted. */
	private SensorSettingsRequest normalize(SensorSettingsRequest request) {
		return new SensorSettingsRequest(
				request.model(),
				request.confidence(),
				request.densityLimit(),
				request.visualOverlays(),
				false,
				request.logErrors(),
				request.webrtcAccess());
	}

	private AppSettings requireRow() {
		return settingsRepository.findById(SETTINGS_ID)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Settings not found"));
	}

	private SensorSettingsRequest readSettings(AppSettings row) {
		try {
			return normalize(sanitizeStored(objectMapper.readValue(row.getPayload(), SensorSettingsRequest.class)));
		} catch (JsonProcessingException ex) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Invalid stored settings");
		}
	}

	private SensorSettingsRequest sanitizeStored(SensorSettingsRequest request) {
		String model = request.model() != null && VALID_MODELS.contains(request.model())
				? request.model()
				: "yolov8-precise";
		int confidence = Math.clamp(request.confidence(), 0, 100);
		int densityLimit = Math.clamp(request.densityLimit(), 1, 500);
		return new SensorSettingsRequest(
				model,
				confidence,
				densityLimit,
				request.visualOverlays(),
				request.audibleAlerts(),
				request.logErrors(),
				request.webrtcAccess());
	}

	private String writePayload(SensorSettingsRequest request) {
		try {
			return objectMapper.writeValueAsString(request);
		} catch (JsonProcessingException ex) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid settings payload");
		}
	}

	private void validate(SensorSettingsRequest request) {
		if (request.model() == null || !VALID_MODELS.contains(request.model())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid model");
		}
		if (request.confidence() < 0 || request.confidence() > 100) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "confidence must be 0-100");
		}
		if (request.densityLimit() < 1 || request.densityLimit() > 500) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "density_limit must be 1-500");
		}
	}
}

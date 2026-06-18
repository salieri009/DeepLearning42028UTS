package com.crowdnav.api.service;

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

	private final AppSettingsRepository settingsRepository;
	private final ObjectMapper objectMapper;

	public SettingsService(AppSettingsRepository settingsRepository, ObjectMapper objectMapper) {
		this.settingsRepository = settingsRepository;
		this.objectMapper = objectMapper;
	}

	public SensorSettingsRequest getSettings() {
		return readSettings(requireRow());
	}

	@Transactional
	public SensorSettingsRequest updateSettings(SensorSettingsRequest request) {
		validate(request);
		SensorSettingsRequest normalized = normalize(request);
		AppSettings row = requireRow();
		row.setPayload(writePayload(normalized));
		row.setUpdatedAt(Instant.now());
		return readSettings(row);
	}

	/** Legacy JSON fields kept for API compat; PRD §9 / FR-2 norms enforced on write. */
	private SensorSettingsRequest normalize(SensorSettingsRequest request) {
		return new SensorSettingsRequest(
				request.model(),
				request.confidence(),
				64,
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
			return normalize(objectMapper.readValue(row.getPayload(), SensorSettingsRequest.class));
		} catch (JsonProcessingException ex) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Invalid stored settings");
		}
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

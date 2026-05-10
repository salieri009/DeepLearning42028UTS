package com.crowdnav.api.service;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import com.crowdnav.api.dto.AnalyzeFrameResponse;
import com.crowdnav.api.dto.BBox;
import com.crowdnav.api.dto.PersonDetection;

/**
 * Calls the Python FastAPI inference service (port 9000) to run YOLOv8 + collision heuristics.
 * Activated when app.inference.mode=remote in application.yml.
 */
@Service
@ConditionalOnProperty(name = "app.inference.mode", havingValue = "remote")
public class RemoteAnalyzeFrameService implements AnalyzeFrameService {

	private final RestTemplate restTemplate = new RestTemplate();
	private final String inferUrl;

	public RemoteAnalyzeFrameService(@Value("${app.inference.base-url}") String baseUrl) {
		this.inferUrl = baseUrl + "/internal/infer";
	}

	@Override
	@SuppressWarnings("unchecked")
	public AnalyzeFrameResponse analyzeFrame(String frameBase64) {
		Map<String, String> body = Map.of("frame_base64", frameBase64 != null ? frameBase64 : "");

		Map<String, Object> raw;
		try {
			raw = restTemplate.postForObject(inferUrl, body, Map.class);
		} catch (RestClientException ex) {
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
					"Inference service unreachable: " + ex.getMessage(), ex);
		}

		if (raw == null) {
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Empty response from inference service");
		}

		List<Map<String, Object>> rawPersons =
				(List<Map<String, Object>>) raw.getOrDefault("persons", List.of());

		List<PersonDetection> persons = rawPersons.stream()
				.map(p -> {
					Map<String, Object> b = (Map<String, Object>) p.get("bbox");
					BBox bbox = new BBox(
							toDouble(b.get("x_center")),
							toDouble(b.get("y_center")),
							toDouble(b.get("width")),
							toDouble(b.get("height")));
					return new PersonDetection(
							(String) p.getOrDefault("class", "person"),
							toDouble(p.get("confidence")),
							bbox,
							(String) p.getOrDefault("proximity_risk", "SAFE"));
				})
				.toList();

		return new AnalyzeFrameResponse(
				persons,
				(String) raw.getOrDefault("crowd_density", "LOW"),
				(String) raw.getOrDefault("max_proximity_risk", "SAFE"),
				(String) raw.getOrDefault("recommendation", "PROCEED"));
	}

	private static double toDouble(Object value) {
		return value instanceof Number n ? n.doubleValue() : 0.0;
	}
}

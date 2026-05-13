package com.crowdnav.api.service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.crowdnav.api.dto.AnalyzeFrameResponse;

/**
 * Calls the Python FastAPI inference service (port 9000) to run YOLOv8 + collision heuristics.
 * Activated when app.inference.mode=remote in application.yml.
 *
 * Uses java.net.http.HttpClient directly to avoid Spring RestClient / HttpURLConnection
 * body-streaming issues where Content-Length is set but body bytes are not delivered.
 */
@Service
@ConditionalOnProperty(name = "app.inference.mode", havingValue = "remote")
public class RemoteAnalyzeFrameService implements AnalyzeFrameService {

	private final String inferUrl;
	private final ObjectMapper objectMapper;
	private final HttpClient httpClient;

	public RemoteAnalyzeFrameService(
			@Value("${app.inference.url:${app.inference.base-url:http://127.0.0.1:9000}}") String baseUrl,
			ObjectMapper objectMapper) {
		this.inferUrl = baseUrl.replaceAll("/+$", "") + "/internal/infer";
		this.objectMapper = objectMapper;
		// Force HTTP/1.1 — uvicorn does not support HTTP/2 cleartext upgrade (h2c).
		// Without this, java.net.http.HttpClient sends "Upgrade: h2c" headers which
		// uvicorn rejects, silently dropping the request body and returning 422.
		this.httpClient = HttpClient.newBuilder()
				.version(HttpClient.Version.HTTP_1_1)
				.connectTimeout(Duration.ofSeconds(10))
				.build();
	}

	@Override
	public AnalyzeFrameResponse analyzeFrame(String frameBase64) {
		final byte[] bodyBytes;
		try {
			bodyBytes = objectMapper.writeValueAsBytes(
					Map.of("frame_base64", frameBase64 != null ? frameBase64 : ""));
		} catch (Exception e) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to serialize inference request", e);
		}

		final HttpResponse<byte[]> httpResponse;
		try {
			HttpRequest request = HttpRequest.newBuilder()
					.uri(URI.create(inferUrl))
					.header("Content-Type", "application/json")
					.POST(HttpRequest.BodyPublishers.ofByteArray(bodyBytes))
					.timeout(Duration.ofSeconds(30))
					.build();
			httpResponse = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
			throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Inference request interrupted");
		} catch (Exception e) {
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Cannot reach inference service: " + e.getMessage(), e);
		}

		int status = httpResponse.statusCode();
		if (status >= 400 && status < 500) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Inference service rejected request: " + status);
		}
		if (status >= 500) {
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
					"Inference service error: " + status);
		}

		try {
			AnalyzeFrameResponse response = objectMapper.readValue(httpResponse.body(), AnalyzeFrameResponse.class);
			if (response == null) {
				throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Empty response from inference service");
			}
			return response;
		} catch (Exception e) {
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Invalid response from inference service", e);
		}
	}
}

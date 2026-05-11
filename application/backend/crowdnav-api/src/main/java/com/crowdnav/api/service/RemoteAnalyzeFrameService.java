package com.crowdnav.api.service;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import com.crowdnav.api.dto.AnalyzeFrameResponse;

/**
 * Calls the Python FastAPI inference service (port 9000) to run YOLOv8 + collision heuristics.
 * Activated when app.inference.mode=remote in application.yml.
 */
@Service
@ConditionalOnProperty(name = "app.inference.mode", havingValue = "remote")
public class RemoteAnalyzeFrameService implements AnalyzeFrameService {

private final RestClient restClient;

public RemoteAnalyzeFrameService(
@Value("${app.inference.url:${app.inference.base-url:http://127.0.0.1:9000}}") String baseUrl) {
this.restClient = RestClient.builder()
.baseUrl(baseUrl)
.build();
}

@Override
public AnalyzeFrameResponse analyzeFrame(String frameBase64) {
AnalyzeFrameResponse response = restClient.post()
.uri("/internal/infer")
.contentType(MediaType.APPLICATION_JSON)
.body(Map.of("frame_base64", frameBase64 != null ? frameBase64 : ""))
.retrieve()
.onStatus(status -> !status.is2xxSuccessful(), (req, res) -> {
if (res.getStatusCode().is4xxClientError()) {
throw new ResponseStatusException(
HttpStatus.BAD_REQUEST,
"Inference service rejected request: " + res.getStatusCode());
}
throw new ResponseStatusException(
HttpStatus.BAD_GATEWAY,
"Inference service returned " + res.getStatusCode());
})
.body(AnalyzeFrameResponse.class);

if (response == null) {
throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Empty response from inference service");
}
return response;
}
}

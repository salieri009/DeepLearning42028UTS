package com.crowdnav.api.health;

import java.net.http.HttpClient;
import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component("inference")
@ConditionalOnProperty(name = "app.inference.mode", havingValue = "remote", matchIfMissing = true)
public class InferenceHealthIndicator implements HealthIndicator {

	private final RestClient restClient;

	public InferenceHealthIndicator(
			@Value("${app.inference.url:${app.inference.base-url:http://127.0.0.1:9000}}") String baseUrl) {
		HttpClient httpClient = HttpClient.newBuilder()
				.version(HttpClient.Version.HTTP_1_1)
				.connectTimeout(Duration.ofSeconds(2))
				.build();
		this.restClient = RestClient.builder()
				.baseUrl(baseUrl)
				.requestFactory(new JdkClientHttpRequestFactory(httpClient))
				.build();
	}

	@Override
	public Health health() {
		try {
			var response = restClient.get()
					.uri("/health")
					.retrieve()
					.toEntity(String.class);
			if (response.getStatusCode().is2xxSuccessful()) {
				return Health.up().withDetail("inference", "reachable").build();
			}
			return Health.down()
					.withDetail("status", response.getStatusCode().value())
					.build();
		} catch (Exception ex) {
			return Health.down().withDetail("error", ex.getMessage()).build();
		}
	}
}

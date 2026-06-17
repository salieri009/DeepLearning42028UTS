package com.crowdnav.api.health;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component("inference")
@ConditionalOnProperty(name = "app.inference.mode", havingValue = "mock")
public class MockInferenceHealthIndicator implements HealthIndicator {

	@Override
	public Health health() {
		return Health.up().withDetail("mode", "mock").build();
	}
}

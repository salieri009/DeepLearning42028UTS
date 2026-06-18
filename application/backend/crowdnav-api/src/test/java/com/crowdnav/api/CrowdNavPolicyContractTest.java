package com.crowdnav.api;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import com.crowdnav.api.policy.CrowdNavPolicy;
import com.crowdnav.api.policy.CrowdNavPolicy.MockPerson;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

class CrowdNavPolicyContractTest {

	private static JsonNode golden;

	@BeforeAll
	static void loadGolden() throws Exception {
		ObjectMapper mapper = new ObjectMapper();
		try (InputStream stream = CrowdNavPolicyContractTest.class.getResourceAsStream(
				"/contracts/crowdnav-policy-golden.json")) {
			golden = mapper.readTree(stream);
		}
	}

	@Test
	void proximityFromHeight_matchesGolden() {
		for (JsonNode caseNode : golden.get("proximity_from_height")) {
			double height = caseNode.get("height").asDouble();
			String expected = caseNode.get("expected").asText();
			assertEquals(expected, CrowdNavPolicy.proximityFromHeight(height));
		}
	}

	@Test
	void crowdDensity_matchesGolden() {
		for (JsonNode caseNode : golden.get("crowd_density")) {
			int count = caseNode.get("count").asInt();
			String worst = caseNode.get("worst").asText();
			String expected = caseNode.get("expected").asText();
			assertEquals(expected, CrowdNavPolicy.crowdDensity(count, worst));
		}
	}

	@Test
	void crowdDensity_scaledLimit_matchesGolden() {
		for (JsonNode caseNode : golden.get("crowd_density_scaled")) {
			int count = caseNode.get("count").asInt();
			String worst = caseNode.get("worst").asText();
			int densityLimit = caseNode.get("density_limit").asInt();
			String expected = caseNode.get("expected").asText();
			assertEquals(expected, CrowdNavPolicy.crowdDensity(count, worst, densityLimit));
		}
	}

	@Test
	void recommendation_matchesGolden() {
		for (JsonNode caseNode : golden.get("recommendation")) {
			String worst = caseNode.get("worst").asText();
			String expected = caseNode.get("expected").asText();
			assertEquals(expected, CrowdNavPolicy.recommendation(worst));
		}
	}

	@Test
	void mockFixture_matchesGolden() {
		JsonNode fixture = golden.get("mock_fixture");
		double minConf = fixture.get("min_confidence").asDouble();
		List<String> risks = new ArrayList<>();
		int count = 0;
		for (MockPerson mock : CrowdNavPolicy.mockPersons()) {
			if (mock.confidence() >= minConf) {
				count += 1;
				risks.add(mock.proximityRisk());
			}
		}
		String worst = CrowdNavPolicy.worstProximityRisk(risks);
		JsonNode expected = fixture.get("expected");
		assertEquals(expected.get("persons_count").asInt(), count);
		assertEquals(expected.get("crowd_density").asText(), CrowdNavPolicy.crowdDensity(count, worst));
		assertEquals(expected.get("max_proximity_risk").asText(), worst);
		assertEquals(expected.get("recommendation").asText(), CrowdNavPolicy.recommendation(worst));
	}
}

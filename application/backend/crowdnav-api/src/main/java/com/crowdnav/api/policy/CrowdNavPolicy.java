package com.crowdnav.api.policy;

import java.util.Collection;
import java.util.List;

/**
 * Canonical CrowdNav domain policy (FR-2 / FR-3 / PRD §8).
 * Mirrors {@code application/inference-service/crowdnav_policy.py}.
 */
public final class CrowdNavPolicy {

	private static final double SAFE_MAX = 0.25;
	private static final double WARN_MAX = 0.45;

	private CrowdNavPolicy() {
	}

	public static String proximityFromHeight(double normHeight) {
		double h = Math.max(0.0, Math.min(1.0, normHeight));
		if (h < SAFE_MAX) {
			return "SAFE";
		}
		if (h < WARN_MAX) {
			return "WARNING";
		}
		return "DANGER";
	}

	public static String worstProximityRisk(Collection<String> states) {
		if (states.stream().anyMatch("DANGER"::equals)) {
			return "DANGER";
		}
		if (states.stream().anyMatch("WARNING"::equals)) {
			return "WARNING";
		}
		return "SAFE";
	}

	public static String crowdDensity(int personCount, String worst) {
		return crowdDensity(personCount, worst, 64);
	}

	public static String crowdDensity(int personCount, String worst, int densityLimit) {
		int limit = Math.max(1, Math.min(500, densityLimit));
		int lowMax = Math.max(1, limit / 32);
		int medMax = Math.max(lowMax + 1, (limit * 5) / 64);

		if (personCount == 0) {
			return "LOW";
		}
		String base;
		if (personCount <= lowMax) {
			base = "LOW";
		} else if (personCount <= medMax) {
			base = "MEDIUM";
		} else {
			base = "HIGH";
		}
		if ("DANGER".equals(worst)) {
			return "HIGH";
		}
		if ("WARNING".equals(worst) && "LOW".equals(base)) {
			return "MEDIUM";
		}
		return base;
	}

	public static String recommendation(String worst) {
		return switch (worst) {
			case "DANGER" -> "STOP";
			case "WARNING" -> "CAUTION";
			default -> "PROCEED";
		};
	}

	/** Fixed mock scene used by MockAnalyzeFrameService and contract golden fixture. */
	public static List<MockPerson> mockPersons() {
		return List.of(
				new MockPerson(0.92, 0.34),
				new MockPerson(0.88, 0.20));
	}

	public record MockPerson(double confidence, double bboxHeight) {
		public String proximityRisk() {
			return proximityFromHeight(bboxHeight);
		}
	}
}

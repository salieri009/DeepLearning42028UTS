package com.crowdnav.api.inference;

import java.util.List;

import com.crowdnav.api.dto.BBox;

/**
 * Port of the height-based proximity idea from {@code train/src/inference/collision_avoidance.py}
 * (safe_max=0.25, warning_max=0.45). Maps worst case to TechSpec §7 strings.
 */
public final class CrowdNavHeuristics {

	private static final double SAFE_MAX = 0.25;
	private static final double WARNING_MAX = 0.45;

	private CrowdNavHeuristics() {
	}

	public static double proximityScore(BBox bbox) {
		double h = clamp01(bbox.height());
		return h;
	}

	public static String maxProximityRisk(List<BBox> boxes) {
		if (boxes == null || boxes.isEmpty()) {
			return "SAFE";
		}
		int worst = 0;
		for (BBox b : boxes) {
			double score = proximityScore(b);
			if (score >= WARNING_MAX) {
				worst = 2;
				break;
			}
			if (score >= SAFE_MAX) {
				worst = 1;
			}
		}
		return switch (worst) {
			case 2 -> "CRITICAL";
			case 1 -> "WARNING";
			default -> "SAFE";
		};
	}

	public static String crowdDensity(int personCount) {
		if (personCount <= 2) {
			return "LOW";
		}
		if (personCount <= 5) {
			return "MEDIUM";
		}
		return "HIGH";
	}

	public static String recommendation(String maxProximityRisk) {
		return switch (maxProximityRisk) {
			case "CRITICAL" -> "STOP";
			case "WARNING" -> "CAUTION";
			default -> "PROCEED";
		};
	}

	private static double clamp01(double v) {
		return Math.max(0.0, Math.min(1.0, v));
	}
}

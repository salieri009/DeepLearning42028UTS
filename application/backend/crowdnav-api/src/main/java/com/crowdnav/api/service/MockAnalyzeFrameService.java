package com.crowdnav.api.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import com.crowdnav.api.dto.AnalyzeFrameResponse;
import com.crowdnav.api.dto.BBox;
import com.crowdnav.api.dto.PersonDetection;
import com.crowdnav.api.dto.settings.SensorSettingsRequest;

@Service
@ConditionalOnProperty(name = "app.inference.mode", havingValue = "mock")
public class MockAnalyzeFrameService implements AnalyzeFrameService {

	private final SettingsService settingsService;

	public MockAnalyzeFrameService(SettingsService settingsService) {
		this.settingsService = settingsService;
	}

	@Override
	public AnalyzeFrameResponse analyzeFrame(String frameBase64, Long sessionId) {
		return analyzeFrame(frameBase64);
	}

	@Override
	public AnalyzeFrameResponse analyzeFrame(String frameBase64) {
		SensorSettingsRequest settings = settingsService.getSettings();
		double minConfidence = settings.confidence() / 100.0;

		List<PersonDetection> raw = List.of(
				new PersonDetection("person", 0.92, new BBox(0.52, 0.56, 0.14, 0.34), "WARNING"),
				new PersonDetection("person", 0.88, new BBox(0.28, 0.49, 0.09, 0.29), "SAFE"));

		List<PersonDetection> persons = new ArrayList<>();
		for (PersonDetection person : raw) {
			if (person.confidence() >= minConfidence) {
				persons.add(person);
			}
		}

		String worst = worstRisk(persons);
		String density = crowdDensity(persons.size(), worst, settings.densityLimit());

		return new AnalyzeFrameResponse(persons, density, worst, recommendation(worst));
	}

	private String worstRisk(List<PersonDetection> persons) {
		boolean danger = persons.stream().anyMatch(p -> "DANGER".equals(p.proximityRisk()));
		if (danger) {
			return "DANGER";
		}
		boolean warning = persons.stream().anyMatch(p -> "WARNING".equals(p.proximityRisk()));
		return warning ? "WARNING" : "SAFE";
	}

	private String crowdDensity(int count, String worst, int densityLimit) {
		if (count == 0) {
			return "LOW";
		}
		if (count >= densityLimit || "DANGER".equals(worst)) {
			return "HIGH";
		}
		int mediumThreshold = Math.max(3, densityLimit / 2);
		if (count >= mediumThreshold || "WARNING".equals(worst)) {
			return "MEDIUM";
		}
		return "LOW";
	}

	private String recommendation(String worst) {
		return switch (worst) {
			case "DANGER" -> "STOP";
			case "WARNING" -> "CAUTION";
			default -> "PROCEED";
		};
	}
}

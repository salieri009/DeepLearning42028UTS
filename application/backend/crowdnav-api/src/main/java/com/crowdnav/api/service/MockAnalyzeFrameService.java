package com.crowdnav.api.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import com.crowdnav.api.dto.AnalyzeFrameResponse;
import com.crowdnav.api.dto.BBox;
import com.crowdnav.api.dto.PersonDetection;
import com.crowdnav.api.dto.settings.SensorSettingsRequest;
import com.crowdnav.api.policy.CrowdNavPolicy;
import com.crowdnav.api.policy.CrowdNavPolicy.MockPerson;

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

		List<PersonDetection> persons = new ArrayList<>();
		for (MockPerson mock : CrowdNavPolicy.mockPersons()) {
			if (mock.confidence() >= minConfidence) {
				persons.add(new PersonDetection(
						"person",
						mock.confidence(),
						new BBox(0.5, 0.5, 0.1, mock.bboxHeight()),
						mock.proximityRisk()));
			}
		}

		List<String> risks = persons.stream().map(PersonDetection::proximityRisk).toList();
		String worst = CrowdNavPolicy.worstProximityRisk(risks);
		String density = CrowdNavPolicy.crowdDensity(persons.size(), worst, settings.densityLimit());

		return new AnalyzeFrameResponse(persons, density, worst, CrowdNavPolicy.recommendation(worst));
	}
}

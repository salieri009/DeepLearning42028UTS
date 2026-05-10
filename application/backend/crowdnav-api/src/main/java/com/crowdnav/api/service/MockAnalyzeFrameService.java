package com.crowdnav.api.service;

import java.util.List;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import com.crowdnav.api.dto.AnalyzeFrameResponse;
import com.crowdnav.api.dto.BBox;
import com.crowdnav.api.dto.PersonDetection;

@Service
@ConditionalOnProperty(name = "app.inference.mode", havingValue = "mock", matchIfMissing = true)
public class MockAnalyzeFrameService implements AnalyzeFrameService {

	@Override
	public AnalyzeFrameResponse analyzeFrame(String frameBase64) {
		return new AnalyzeFrameResponse(
				List.of(
						new PersonDetection(
								"person",
								0.92,
								new BBox(0.52, 0.56, 0.14, 0.34),
								"WARNING"),
						new PersonDetection(
								"person",
								0.88,
								new BBox(0.28, 0.49, 0.09, 0.29),
								"SAFE")),
				"LOW",
				"WARNING",
				"CAUTION");
	}
}

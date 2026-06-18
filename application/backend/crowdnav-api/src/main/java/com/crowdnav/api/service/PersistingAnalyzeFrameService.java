package com.crowdnav.api.service;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import com.crowdnav.api.dto.AnalyzeFrameResponse;

@Service
@Primary
@ConditionalOnProperty(name = "app.persistence.enabled", havingValue = "true", matchIfMissing = true)
public class PersistingAnalyzeFrameService implements AnalyzeFrameService {

	private final AnalyzeFrameService delegate;
	private final FramePersistenceService framePersistenceService;

	public PersistingAnalyzeFrameService(
			@Qualifier("coreAnalyzeFrameService") AnalyzeFrameService delegate,
			FramePersistenceService framePersistenceService) {
		this.delegate = delegate;
		this.framePersistenceService = framePersistenceService;
	}

	@Override
	public AnalyzeFrameResponse analyzeFrame(String frameBase64, Long sessionId) {
		long start = System.nanoTime();
		AnalyzeFrameResponse response = delegate.analyzeFrame(frameBase64, sessionId);
		int latencyMs = (int) ((System.nanoTime() - start) / 1_000_000L);

		if (sessionId != null) {
			framePersistenceService.persistFrame(sessionId, response, latencyMs);
		}

		return response;
	}
}

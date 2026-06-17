package com.crowdnav.api.service;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.crowdnav.api.dto.AnalyzeFrameResponse;
import com.crowdnav.api.persistence.entity.AnalysisSession;
import com.crowdnav.api.persistence.mapper.PersistenceMapper;
import com.crowdnav.api.persistence.repository.AnalysisSessionRepository;
import com.crowdnav.api.persistence.repository.FrameRepository;

@Service
public class FramePersistenceService {

	private final AnalysisSessionRepository sessionRepository;
	private final FrameRepository frameRepository;

	public FramePersistenceService(
			AnalysisSessionRepository sessionRepository,
			FrameRepository frameRepository) {
		this.sessionRepository = sessionRepository;
		this.frameRepository = frameRepository;
	}

	@Async
	@Transactional
	public void persistFrame(Long sessionId, AnalyzeFrameResponse response, int latencyMs) {
		AnalysisSession session = sessionRepository.findById(sessionId).orElse(null);
		if (session == null) {
			return;
		}

		int sequenceNo = frameRepository.findMaxSequenceNoBySessionId(sessionId).orElse(-1) + 1;
		try {
			frameRepository.save(PersistenceMapper.toFrame(session, sequenceNo, response, latencyMs));
		} catch (DataIntegrityViolationException ex) {
			// Single retry for concurrent sequence_no assignment (v1.1 single-client assumption).
			int retrySequence = frameRepository.findMaxSequenceNoBySessionId(sessionId).orElse(-1) + 1;
			frameRepository.save(PersistenceMapper.toFrame(session, retrySequence, response, latencyMs));
		}
	}
}

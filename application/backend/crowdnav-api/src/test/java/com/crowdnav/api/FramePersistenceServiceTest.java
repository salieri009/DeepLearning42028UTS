package com.crowdnav.api;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.crowdnav.api.dto.AnalyzeFrameResponse;
import com.crowdnav.api.dto.BBox;
import com.crowdnav.api.dto.PersonDetection;
import com.crowdnav.api.persistence.entity.AnalysisSession;
import com.crowdnav.api.persistence.entity.SourceType;
import com.crowdnav.api.persistence.repository.AnalysisSessionRepository;
import com.crowdnav.api.persistence.repository.FrameRepository;
import com.crowdnav.api.service.FramePersistenceService;

@SpringBootTest
class FramePersistenceServiceTest {

	@Autowired
	private FramePersistenceService framePersistenceService;

	@Autowired
	private AnalysisSessionRepository sessionRepository;

	@Autowired
	private FrameRepository frameRepository;

	@BeforeEach
	void clean() {
		frameRepository.deleteAll();
		sessionRepository.deleteAll();
	}

	@Test
	void persistFrame_skipsWhenSessionClosed() {
		AnalysisSession session = sessionRepository.save(
				new AnalysisSession(Instant.now(), "closed-persist", SourceType.WEBCAM));
		session.setEndedAt(Instant.now());
		sessionRepository.save(session);

		AnalyzeFrameResponse response = new AnalyzeFrameResponse(
				List.of(new PersonDetection("person", 0.9, new BBox(0.5, 0.5, 0.1, 0.3), "WARNING")),
				"LOW",
				"WARNING",
				"CAUTION");

		framePersistenceService.persistFrame(session.getId(), response, 42);

		assertThat(frameRepository.countBySessionId(session.getId())).isZero();
	}

	@Test
	void persistFrame_writesWhenSessionOpen() throws InterruptedException {
		AnalysisSession session = sessionRepository.save(
				new AnalysisSession(Instant.now(), "open-persist", SourceType.WEBCAM));

		AnalyzeFrameResponse response = new AnalyzeFrameResponse(
				List.of(new PersonDetection("person", 0.9, new BBox(0.5, 0.5, 0.1, 0.3), "WARNING")),
				"LOW",
				"WARNING",
				"CAUTION");

		framePersistenceService.persistFrame(session.getId(), response, 42);

		TimeUnit.MILLISECONDS.sleep(300);

		assertThat(frameRepository.countBySessionId(session.getId())).isEqualTo(1);
	}
}

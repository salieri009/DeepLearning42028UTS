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
import com.crowdnav.api.persistence.entity.CampusZone;
import com.crowdnav.api.persistence.entity.SourceType;
import com.crowdnav.api.persistence.repository.AnalysisSessionRepository;
import com.crowdnav.api.persistence.repository.CampusZoneRepository;
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

	@Autowired
	private CampusZoneRepository zoneRepository;

	private CampusZone defaultZone;

	@BeforeEach
	void clean() {
		frameRepository.deleteAll();
		sessionRepository.deleteAll();
		defaultZone = zoneRepository.findById("node-alpha").orElseThrow();
	}

	private AnalysisSession newSession(String label) {
		return new AnalysisSession(Instant.now(), label, SourceType.WEBCAM, defaultZone);
	}

	@Test
	void persistFrame_skipsWhenSessionClosed() {
		AnalysisSession session = sessionRepository.save(newSession("closed-persist"));
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
		AnalysisSession session = sessionRepository.save(newSession("open-persist"));

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

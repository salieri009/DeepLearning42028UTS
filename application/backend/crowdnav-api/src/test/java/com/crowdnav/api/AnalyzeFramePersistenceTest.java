package com.crowdnav.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Base64;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import com.crowdnav.api.persistence.repository.AnalysisSessionRepository;
import com.crowdnav.api.persistence.repository.DetectionRepository;
import com.crowdnav.api.persistence.repository.FrameRepository;

@SpringBootTest
@AutoConfigureMockMvc
class AnalyzeFramePersistenceTest {

	private static final String VALID_B64 = Base64.getEncoder().encodeToString(new byte[] { 1, 2, 3 });

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private FrameRepository frameRepository;

	@Autowired
	private DetectionRepository detectionRepository;

	@Autowired
	private AnalysisSessionRepository sessionRepository;

	@BeforeEach
	void resetDb() throws InterruptedException {
		TimeUnit.MILLISECONDS.sleep(200);
		detectionRepository.deleteAll();
		frameRepository.deleteAll();
		sessionRepository.deleteAll();
	}

	@Test
	void analyzeFrame_withoutSessionId_doesNotPersist() throws Exception {
		long framesBefore = frameRepository.count();
		long detectionsBefore = detectionRepository.count();

		mockMvc.perform(post("/api/v1/analyze-frame")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"frame_base64\": \"" + VALID_B64 + "\"}"))
				.andExpect(status().isOk());

		TimeUnit.MILLISECONDS.sleep(200);

		assertThat(frameRepository.count()).isEqualTo(framesBefore);
		assertThat(detectionRepository.count()).isEqualTo(detectionsBefore);
	}

	@Test
	void analyzeFrame_withSessionId_persistsFrameAndDetections() throws Exception {
		MvcResult session = mockMvc.perform(post("/api/v1/sessions")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"client_label\":\"persist-test\",\"source_type\":\"WEBCAM\"}"))
				.andExpect(status().isCreated())
				.andReturn();

		long sessionId = Long.parseLong(
				session.getResponse().getContentAsString().replaceAll(".*\"id\"\\s*:\\s*(\\d+).*", "$1"));

		mockMvc.perform(post("/api/v1/analyze-frame")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"frame_base64\": \"" + VALID_B64 + "\", \"session_id\": " + sessionId + "}"))
				.andExpect(status().isOk());

		TimeUnit.MILLISECONDS.sleep(300);

		assertThat(frameRepository.countBySessionId(sessionId)).isEqualTo(1);
		assertThat(detectionRepository.findAll()).hasSizeGreaterThanOrEqualTo(2);
	}

	@Test
	void analyzeFrame_unknownSessionId_returns404() throws Exception {
		mockMvc.perform(post("/api/v1/analyze-frame")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"frame_base64\": \"" + VALID_B64 + "\", \"session_id\": 999999}"))
				.andExpect(status().isNotFound());
	}
}

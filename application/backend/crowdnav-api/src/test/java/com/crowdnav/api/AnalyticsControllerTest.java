package com.crowdnav.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import static com.crowdnav.api.support.SessionTestSupport.withSessionToken;

import java.util.Base64;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.crowdnav.api.persistence.repository.AnalysisSessionRepository;
import com.crowdnav.api.persistence.repository.DetectionRepository;
import com.crowdnav.api.persistence.repository.FrameRepository;
import com.crowdnav.api.support.SessionTestSupport;
import com.crowdnav.api.support.SessionTestSupport.CreatedSession;

@SpringBootTest
@AutoConfigureMockMvc
class AnalyticsControllerTest {

	private static final String VALID_B64 = Base64.getEncoder().encodeToString(new byte[] { 1, 2, 3 });

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private AnalysisSessionRepository sessionRepository;

	@Autowired
	private FrameRepository frameRepository;

	@Autowired
	private DetectionRepository detectionRepository;

	@BeforeEach
	void resetDb() throws InterruptedException {
		TimeUnit.MILLISECONDS.sleep(200);
		detectionRepository.deleteAll();
		frameRepository.deleteAll();
		sessionRepository.deleteAll();
	}

	@Test
	void summary_empty_returnsZeroedPayload() throws Exception {
		mockMvc.perform(get("/api/v1/analytics/summary"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.safety_score").value(0))
				.andExpect(jsonPath("$.frame_count").value(0))
				.andExpect(jsonPath("$.peak_hours").isArray());
	}

	@Test
	void summary_afterAnalyze_returnsAggregates() throws Exception {
		CreatedSession session = SessionTestSupport.createSession(mockMvc, "analytics", "WEBCAM");

		mockMvc.perform(withSessionToken(post("/api/v1/analyze-frame")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"frame_base64\": \"" + VALID_B64 + "\", \"session_id\": " + session.id() + "}"),
				session.accessToken()))
				.andExpect(status().isOk());

		TimeUnit.MILLISECONDS.sleep(300);

		mockMvc.perform(get("/api/v1/analytics/summary").param("days", "7"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.frame_count").value(1))
				.andExpect(jsonPath("$.session_count").value(1))
				.andExpect(jsonPath("$.zone_risks").isArray())
				.andExpect(jsonPath("$.peak_hours").isArray());
	}
}

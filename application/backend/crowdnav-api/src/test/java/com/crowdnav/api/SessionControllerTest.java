package com.crowdnav.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import static com.crowdnav.api.support.SessionTestSupport.getDetections;
import static com.crowdnav.api.support.SessionTestSupport.getFrames;
import static com.crowdnav.api.support.SessionTestSupport.patchSession;
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
import com.crowdnav.api.support.TestSettingsSupport;

@SpringBootTest
@AutoConfigureMockMvc
class SessionControllerTest {

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
	void resetDb() throws Exception {
		TimeUnit.MILLISECONDS.sleep(200);
		detectionRepository.deleteAll();
		frameRepository.deleteAll();
		sessionRepository.deleteAll();
		TestSettingsSupport.resetSettings(mockMvc);
	}

	@Test
	void createSession_returns201WithAccessToken() throws Exception {
		mockMvc.perform(post("/api/v1/sessions")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"client_label\":\"demo\",\"source_type\":\"WEBCAM\"}"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").isNumber())
				.andExpect(jsonPath("$.access_token").isNotEmpty())
				.andExpect(jsonPath("$.client_label").value("demo"))
				.andExpect(jsonPath("$.source_type").value("WEBCAM"));
	}

	@Test
	void createSession_invalidSourceType_returns400() throws Exception {
		mockMvc.perform(post("/api/v1/sessions")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"client_label\":\"demo\",\"source_type\":\"INVALID\"}"))
				.andExpect(status().isBadRequest());
	}

	@Test
	void createSession_missingSourceType_returns400() throws Exception {
		mockMvc.perform(post("/api/v1/sessions")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"client_label\":\"demo\"}"))
				.andExpect(status().isBadRequest());
	}

	@Test
	void listAndGetSession_returnsAggregates() throws Exception {
		CreatedSession created = SessionTestSupport.createSession(mockMvc, "laptop", "MOCK");

		mockMvc.perform(get("/api/v1/sessions"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.items").isArray())
				.andExpect(jsonPath("$.total").isNumber());

		mockMvc.perform(withSessionToken(get("/api/v1/sessions/" + created.id()), created.accessToken()))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.frame_count").value(0))
				.andExpect(jsonPath("$.worst_risk").value("SAFE"));
	}

	@Test
	void getSession_withoutToken_returns403() throws Exception {
		CreatedSession created = SessionTestSupport.createSession(mockMvc, "protected", "MOCK");
		mockMvc.perform(get("/api/v1/sessions/" + created.id()))
				.andExpect(status().isForbidden());
	}

	@Test
	void getSession_notFound_returns404() throws Exception {
		mockMvc.perform(get("/api/v1/sessions/999999"))
				.andExpect(status().isNotFound());
	}

	@Test
	void closeSession_setsEndedAt() throws Exception {
		CreatedSession created = SessionTestSupport.createSession(mockMvc, "close-test", "WEBCAM");

		mockMvc.perform(patchSession(created.id(), created.accessToken()))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.ended_at").isNotEmpty())
				.andExpect(jsonPath("$.access_token").doesNotExist());

		mockMvc.perform(patchSession(created.id(), created.accessToken()))
				.andExpect(status().isConflict());
	}

	@Test
	void closeSession_notFound_returns404() throws Exception {
		mockMvc.perform(patchSession(999999, "invalid-token"))
				.andExpect(status().isNotFound());
	}

	@Test
	void listSessions_offsetSkipsCorrectly() throws Exception {
		for (int i = 0; i < 3; i++) {
			SessionTestSupport.createSession(mockMvc, "offset-" + i, "MOCK");
		}

		long total = sessionRepository.count();
		mockMvc.perform(get("/api/v1/sessions").param("limit", "1").param("offset", "1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.items.length()").value(1))
				.andExpect(jsonPath("$.items[0].frame_count").exists())
				.andExpect(jsonPath("$.total").value((int) total));
	}

	@Test
	void listSessions_filtersBySourceType() throws Exception {
		SessionTestSupport.createSession(mockMvc, "webcam-only", "WEBCAM");
		SessionTestSupport.createSession(mockMvc, "mock-only", "MOCK");

		mockMvc.perform(get("/api/v1/sessions").param("source_type", "MOCK"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.items.length()").value(1))
				.andExpect(jsonPath("$.items[0].source_type").value("MOCK"));
	}

	@Test
	void listDetections_afterPersist_returnsItems() throws Exception {
		CreatedSession created = SessionTestSupport.createSession(mockMvc, "det-test", "WEBCAM");

		mockMvc.perform(withSessionToken(post("/api/v1/analyze-frame")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"frame_base64\": \"" + VALID_B64 + "\", \"session_id\": " + created.id() + "}"),
				created.accessToken()))
				.andExpect(status().isOk());

		TimeUnit.MILLISECONDS.sleep(300);

		mockMvc.perform(getDetections(created.id(), created.accessToken()))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.items").isArray())
				.andExpect(jsonPath("$.items.length()").value(2));

		mockMvc.perform(getDetections(created.id(), created.accessToken()).param("risk", "WARNING"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.items.length()").value(1));

		mockMvc.perform(getDetections(created.id(), created.accessToken()).param("class", "person"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.items.length()").value(2));
	}

	@Test
	void listDetections_withoutToken_returns403() throws Exception {
		CreatedSession created = SessionTestSupport.createSession(mockMvc, "idor", "MOCK");
		mockMvc.perform(get("/api/v1/sessions/" + created.id() + "/detections"))
				.andExpect(status().isForbidden());
	}

	@Test
	void listDetections_invalidRisk_returns400() throws Exception {
		CreatedSession created = SessionTestSupport.createSession(mockMvc, "risk-filter", "MOCK");

		mockMvc.perform(getDetections(created.id(), created.accessToken()).param("risk", "FOOBAR"))
				.andExpect(status().isBadRequest());
	}

	@Test
	void listDetections_invalidClass_returns400() throws Exception {
		CreatedSession created = SessionTestSupport.createSession(mockMvc, "class-filter", "MOCK");

		mockMvc.perform(getDetections(created.id(), created.accessToken()).param("class", "dog"))
				.andExpect(status().isBadRequest());
	}

	@Test
	void listDetections_notFound_returns404() throws Exception {
		mockMvc.perform(get("/api/v1/sessions/999999/detections"))
				.andExpect(status().isNotFound());
	}

	@Test
	void listFrames_afterPersist_returnsTrail() throws Exception {
		CreatedSession created = SessionTestSupport.createSession(mockMvc, "frame-trail", "WEBCAM");

		mockMvc.perform(withSessionToken(post("/api/v1/analyze-frame")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"frame_base64\": \"" + VALID_B64 + "\", \"session_id\": " + created.id() + "}"),
				created.accessToken()))
				.andExpect(status().isOk());

		TimeUnit.MILLISECONDS.sleep(300);

		mockMvc.perform(getFrames(created.id(), created.accessToken()))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.items").isArray())
				.andExpect(jsonPath("$.items.length()").value(1))
				.andExpect(jsonPath("$.items[0].sequence_no").value(0))
				.andExpect(jsonPath("$.items[0].person_count").isNumber());
	}

	@Test
	void listFrames_notFound_returns404() throws Exception {
		mockMvc.perform(get("/api/v1/sessions/999999/frames"))
				.andExpect(status().isNotFound());
	}
}

package com.crowdnav.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
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
	void resetDb() throws InterruptedException {
		TimeUnit.MILLISECONDS.sleep(200);
		detectionRepository.deleteAll();
		frameRepository.deleteAll();
		sessionRepository.deleteAll();
	}

	@Test
	void createSession_returns201() throws Exception {
		mockMvc.perform(post("/api/v1/sessions")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"client_label\":\"demo\",\"source_type\":\"WEBCAM\"}"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").isNumber())
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
		MvcResult created = mockMvc.perform(post("/api/v1/sessions")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"client_label\":\"laptop\",\"source_type\":\"MOCK\"}"))
				.andExpect(status().isCreated())
				.andReturn();

		long id = Long.parseLong(created.getResponse().getContentAsString().replaceAll(".*\"id\"\\s*:\\s*(\\d+).*", "$1"));

		mockMvc.perform(get("/api/v1/sessions"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.items").isArray())
				.andExpect(jsonPath("$.total").isNumber());

		mockMvc.perform(get("/api/v1/sessions/" + id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.frame_count").value(0))
				.andExpect(jsonPath("$.worst_risk").value("SAFE"));
	}

	@Test
	void getSession_notFound_returns404() throws Exception {
		mockMvc.perform(get("/api/v1/sessions/999999"))
				.andExpect(status().isNotFound());
	}

	@Test
	void closeSession_setsEndedAt() throws Exception {
		long id = createSessionId("close-test", "WEBCAM");

		mockMvc.perform(patch("/api/v1/sessions/" + id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.ended_at").isNotEmpty());

		mockMvc.perform(patch("/api/v1/sessions/" + id))
				.andExpect(status().isConflict());
	}

	@Test
	void closeSession_notFound_returns404() throws Exception {
		mockMvc.perform(patch("/api/v1/sessions/999999"))
				.andExpect(status().isNotFound());
	}

	@Test
	void listSessions_offsetSkipsCorrectly() throws Exception {
		for (int i = 0; i < 3; i++) {
			createSessionId("offset-" + i, "MOCK");
		}

		long total = sessionRepository.count();
		mockMvc.perform(get("/api/v1/sessions").param("limit", "1").param("offset", "1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.items.length()").value(1))
				.andExpect(jsonPath("$.total").value((int) total));
	}

	@Test
	void listDetections_afterPersist_returnsItems() throws Exception {
		long sessionId = createSessionId("det-test", "WEBCAM");

		mockMvc.perform(post("/api/v1/analyze-frame")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"frame_base64\": \"" + VALID_B64 + "\", \"session_id\": " + sessionId + "}"))
				.andExpect(status().isOk());

		TimeUnit.MILLISECONDS.sleep(300);

		mockMvc.perform(get("/api/v1/sessions/" + sessionId + "/detections"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.items").isArray())
				.andExpect(jsonPath("$.items.length()").value(2));

		mockMvc.perform(get("/api/v1/sessions/" + sessionId + "/detections").param("risk", "WARNING"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.items.length()").value(1));

		mockMvc.perform(get("/api/v1/sessions/" + sessionId + "/detections").param("class", "person"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.items.length()").value(2));
	}

	@Test
	void listDetections_invalidRisk_returns400() throws Exception {
		long sessionId = createSessionId("risk-filter", "MOCK");

		mockMvc.perform(get("/api/v1/sessions/" + sessionId + "/detections").param("risk", "FOOBAR"))
				.andExpect(status().isBadRequest());
	}

	@Test
	void listDetections_invalidClass_returns400() throws Exception {
		long sessionId = createSessionId("class-filter", "MOCK");

		mockMvc.perform(get("/api/v1/sessions/" + sessionId + "/detections").param("class", "dog"))
				.andExpect(status().isBadRequest());
	}

	@Test
	void listDetections_notFound_returns404() throws Exception {
		mockMvc.perform(get("/api/v1/sessions/999999/detections"))
				.andExpect(status().isNotFound());
	}

	private long createSessionId(String label, String sourceType) throws Exception {
		MvcResult created = mockMvc.perform(post("/api/v1/sessions")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"client_label\":\"" + label + "\",\"source_type\":\"" + sourceType + "\"}"))
				.andExpect(status().isCreated())
				.andReturn();
		return Long.parseLong(created.getResponse().getContentAsString().replaceAll(".*\"id\"\\s*:\\s*(\\d+).*", "$1"));
	}
}

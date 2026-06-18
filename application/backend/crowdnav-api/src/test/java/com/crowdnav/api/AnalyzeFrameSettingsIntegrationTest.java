package com.crowdnav.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Base64;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class AnalyzeFrameSettingsIntegrationTest {

	private static final String VALID_B64 = Base64.getEncoder().encodeToString(new byte[] { 1, 2, 3 });

	@Autowired
	private MockMvc mockMvc;

	@Test
	void analyzeFrame_respectsConfidenceThresholdFromSettings() throws Exception {
		mockMvc.perform(put("/api/v1/settings")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "model": "yolov8-precise",
								  "confidence": 95,
								  "density_limit": 64,
								  "visual_overlays": true,
								  "audible_alerts": false,
								  "log_errors": false,
								  "webrtc_access": true
								}
								"""))
				.andExpect(status().isOk());

		mockMvc.perform(post("/api/v1/analyze-frame")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"frame_base64\": \"" + VALID_B64 + "\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.persons.length()").value(1))
				.andExpect(jsonPath("$.persons[0].confidence").value(0.92));
	}
}

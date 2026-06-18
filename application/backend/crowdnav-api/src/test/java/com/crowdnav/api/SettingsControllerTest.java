package com.crowdnav.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class SettingsControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@Test
	void getSettings_returnsDefaults() throws Exception {
		mockMvc.perform(get("/api/v1/settings"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.model").value("yolov8-precise"))
				.andExpect(jsonPath("$.confidence").value(85))
				.andExpect(jsonPath("$.density_limit").value(64));
	}

	@Test
	void updateSettings_persistsValues() throws Exception {
		mockMvc.perform(put("/api/v1/settings")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "model": "yolov8-nano",
								  "confidence": 70,
								  "density_limit": 40,
								  "visual_overlays": false,
								  "audible_alerts": true,
								  "log_errors": true,
								  "webrtc_access": false
								}
								"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.model").value("yolov8-nano"))
				.andExpect(jsonPath("$.confidence").value(70));

		mockMvc.perform(get("/api/v1/settings"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.model").value("yolov8-nano"))
				.andExpect(jsonPath("$.audible_alerts").value(true));
	}

	@Test
	void updateSettings_invalidModel_returns400() throws Exception {
		mockMvc.perform(put("/api/v1/settings")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "model": "invalid",
								  "confidence": 70,
								  "density_limit": 40,
								  "visual_overlays": false,
								  "audible_alerts": true,
								  "log_errors": true,
								  "webrtc_access": false
								}
								"""))
				.andExpect(status().isBadRequest());
	}
}

package com.crowdnav.api.support;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

public final class TestSettingsSupport {

	public static final String DEFAULT_SETTINGS_JSON = """
			{
			  "model": "yolov8-precise",
			  "confidence": 85,
			  "density_limit": 64,
			  "visual_overlays": true,
			  "audible_alerts": false,
			  "log_errors": false,
			  "webrtc_access": true
			}
			""";

	private TestSettingsSupport() {
	}

	public static void resetSettings(MockMvc mockMvc) throws Exception {
		mockMvc.perform(put("/api/v1/settings")
						.contentType(MediaType.APPLICATION_JSON)
						.content(DEFAULT_SETTINGS_JSON))
				.andExpect(status().isOk());
	}
}

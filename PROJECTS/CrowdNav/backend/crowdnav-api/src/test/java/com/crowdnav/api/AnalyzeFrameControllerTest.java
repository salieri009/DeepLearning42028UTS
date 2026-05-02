package com.crowdnav.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class AnalyzeFrameControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@Test
	void analyzeFrame_json_returnsTechSpecMockShape() throws Exception {
		mockMvc.perform(post("/api/v1/analyze-frame")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.persons").isArray())
				.andExpect(jsonPath("$.persons.length()").value(2))
				.andExpect(jsonPath("$.crowd_density").value("LOW"))
				.andExpect(jsonPath("$.max_proximity_risk").value("SAFE"))
				.andExpect(jsonPath("$.recommendation").value("PROCEED"));
	}

	@Test
	void analyzeFrame_multipart_returnsSameMock() throws Exception {
		var file = new MockMultipartFile("image", "frame.jpg", "image/jpeg", new byte[] { 0, 0 });
		mockMvc.perform(multipart("/api/v1/analyze-frame").file(file))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.crowd_density").value("LOW"))
				.andExpect(jsonPath("$.recommendation").value("PROCEED"));
	}
}

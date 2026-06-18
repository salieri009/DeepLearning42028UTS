package com.crowdnav.api.support;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.crowdnav.api.config.SessionAuthProperties;
import com.jayway.jsonpath.JsonPath;

public final class SessionTestSupport {

	private SessionTestSupport() {
	}

	public record CreatedSession(long id, String accessToken) {
	}

	public static CreatedSession createSession(MockMvc mockMvc, String label, String sourceType) throws Exception {
		MvcResult created = mockMvc.perform(post("/api/v1/sessions")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"client_label\":\"" + label + "\",\"source_type\":\"" + sourceType + "\"}"))
				.andReturn();
		String body = created.getResponse().getContentAsString();
		long id = JsonPath.parse(body).read("$.id", Long.class);
		String accessToken = JsonPath.parse(body).read("$.access_token", String.class);
		return new CreatedSession(id, accessToken);
	}

	public static MockHttpServletRequestBuilder withSessionToken(
			MockHttpServletRequestBuilder builder, String accessToken) {
		return builder.header(SessionAuthProperties.ACCESS_TOKEN_HEADER, accessToken);
	}

	public static MockHttpServletRequestBuilder getSession(MockMvc mockMvc, long id, String accessToken)
			throws Exception {
		return withSessionToken(get("/api/v1/sessions/" + id), accessToken);
	}

	public static MockHttpServletRequestBuilder patchSession(long id, String accessToken) {
		return withSessionToken(patch("/api/v1/sessions/" + id), accessToken);
	}

	public static MockHttpServletRequestBuilder getDetections(long sessionId, String accessToken) {
		return withSessionToken(get("/api/v1/sessions/" + sessionId + "/detections"), accessToken);
	}

	public static MockHttpServletRequestBuilder getFrames(long sessionId, String accessToken) {
		return withSessionToken(get("/api/v1/sessions/" + sessionId + "/frames"), accessToken);
	}
}

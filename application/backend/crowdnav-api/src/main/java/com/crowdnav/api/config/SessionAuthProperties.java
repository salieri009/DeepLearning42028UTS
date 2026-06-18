package com.crowdnav.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.session")
public record SessionAuthProperties(boolean requireAccessToken) {

	public SessionAuthProperties {
		// default true when property omitted
	}

	public static final String ACCESS_TOKEN_HEADER = "X-Session-Token";
}

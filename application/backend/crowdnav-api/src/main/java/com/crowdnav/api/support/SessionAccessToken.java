package com.crowdnav.api.support;

import java.util.UUID;

public final class SessionAccessToken {

	private SessionAccessToken() {
	}

	public static String generate() {
		return UUID.randomUUID().toString().replace("-", "");
	}
}

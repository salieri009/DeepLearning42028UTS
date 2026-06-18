package com.crowdnav.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.upload")
public record FrameUploadProperties(int maxFrameBytes) {

	public FrameUploadProperties {
		if (maxFrameBytes < 1) {
			throw new IllegalArgumentException("app.upload.max-frame-bytes must be positive");
		}
	}

	public int maxBase64Chars() {
		// Base64 expands ~4/3; allow encoded payload up to ceil(bytes/3)*4
		return ((maxFrameBytes + 2) / 3) * 4;
	}
}

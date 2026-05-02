package com.crowdnav.api.service;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.crowdnav.api.dto.AnalyzeFrameResponse;

/**
 * Placeholder for the future remote-inference mode (calls the Python service).
 * Activated when app.inference.mode=remote; fails fast with HTTP 501 until implemented.
 */
@Service
@ConditionalOnProperty(name = "app.inference.mode", havingValue = "remote")
public class RemoteAnalyzeFrameService implements AnalyzeFrameService {

	@Override
	public AnalyzeFrameResponse analyzeFrame() {
		throw new ResponseStatusException(
				HttpStatus.NOT_IMPLEMENTED,
				"Remote inference mode is not yet implemented. Set app.inference.mode=mock to use the mock service.");
	}
}

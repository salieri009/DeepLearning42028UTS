package com.crowdnav.api.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.crowdnav.api.dto.settings.SensorSettingsRequest;
import com.crowdnav.api.service.SettingsService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/settings")
public class SettingsController {

	private final SettingsService settingsService;

	public SettingsController(SettingsService settingsService) {
		this.settingsService = settingsService;
	}

	@GetMapping
	public SensorSettingsRequest getSettings() {
		return settingsService.getSettings();
	}

	@PutMapping
	public SensorSettingsRequest updateSettings(@Valid @RequestBody SensorSettingsRequest request) {
		return settingsService.updateSettings(request);
	}
}

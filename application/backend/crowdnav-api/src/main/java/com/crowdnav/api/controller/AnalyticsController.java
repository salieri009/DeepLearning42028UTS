package com.crowdnav.api.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.crowdnav.api.dto.analytics.AnalyticsSummaryResponse;
import com.crowdnav.api.service.AnalyticsService;

@RestController
@RequestMapping("/api/v1/analytics")
public class AnalyticsController {

	private final AnalyticsService analyticsService;

	public AnalyticsController(AnalyticsService analyticsService) {
		this.analyticsService = analyticsService;
	}

	@GetMapping("/summary")
	public AnalyticsSummaryResponse summary(@RequestParam(defaultValue = "7") int days) {
		return analyticsService.buildSummary(days);
	}
}

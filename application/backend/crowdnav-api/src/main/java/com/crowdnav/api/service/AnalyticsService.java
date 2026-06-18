package com.crowdnav.api.service;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.crowdnav.api.dto.analytics.AnalyticsSummaryResponse;
import com.crowdnav.api.dto.analytics.HotspotItem;
import com.crowdnav.api.dto.analytics.PeakHourItem;
import com.crowdnav.api.dto.analytics.ZoneRiskItem;
import com.crowdnav.api.persistence.projection.FrameRiskAggregateRow;
import com.crowdnav.api.persistence.projection.HotspotAggregateRow;
import com.crowdnav.api.persistence.projection.PeakHourAggregateRow;
import com.crowdnav.api.persistence.repository.FrameRepository;

@Service
@Transactional(readOnly = true)
public class AnalyticsService {

	private static final int[] PEAK_HOUR_BUCKETS = { 8, 10, 12, 14, 16, 18, 20 };

	private final FrameRepository frameRepository;

	public AnalyticsService(FrameRepository frameRepository) {
		this.frameRepository = frameRepository;
	}

	public AnalyticsSummaryResponse buildSummary(int days) {
		int safeDays = Math.clamp(days, 1, 30);
		Instant since = Instant.now().minus(safeDays, ChronoUnit.DAYS);
		Instant priorSince = Instant.now().minus(safeDays * 2L, ChronoUnit.DAYS);

		long frameCount = frameRepository.countByCapturedAtGreaterThanEqual(since);
		long sessionCount = frameRepository.countDistinctSessionsSince(since);

		if (frameCount == 0) {
			return emptySummary();
		}

		long dangerCount = frameRepository.countByCapturedAtGreaterThanEqualAndMaxProximityRisk(since, "DANGER");
		long warningCount = frameRepository.countByCapturedAtGreaterThanEqualAndMaxProximityRisk(since, "WARNING");
		int safetyScore = computeSafetyScore((int) frameCount, dangerCount, warningCount);
		String safetyLabel = labelForScore(safetyScore);

		long priorDanger = frameRepository.countByCapturedAtGreaterThanEqualAndCapturedAtLessThanAndMaxProximityRisk(
				priorSince, since, "DANGER");
		double trendPercent = priorDanger == 0
				? (dangerCount > 0 ? 100.0 : 0.0)
				: ((dangerCount - priorDanger) * 100.0) / priorDanger;

		List<PeakHourItem> peakHours = buildPeakHours(frameRepository.aggregatePeakHoursSince(since));
		String busiestWindow = busiestWindow(peakHours);
		List<ZoneRiskItem> zoneRisks = buildZoneRisks(frameRepository.aggregateRiskBySourceSince(since));
		List<HotspotItem> hotspots = buildHotspots(
				frameRepository.findTopDangerHotspotsSince(since, PageRequest.of(0, 3)));

		return new AnalyticsSummaryResponse(
				safetyScore,
				safetyLabel,
				Math.round(trendPercent * 10.0) / 10.0,
				(int) dangerCount,
				busiestWindow,
				peakHours,
				zoneRisks,
				hotspots,
				frameCount,
				sessionCount);
	}

	private AnalyticsSummaryResponse emptySummary() {
		List<PeakHourItem> peakHours = new ArrayList<>();
		for (int hour : PEAK_HOUR_BUCKETS) {
			peakHours.add(new PeakHourItem(String.format(Locale.US, "%02d:00", hour), 0, false));
		}
		return new AnalyticsSummaryResponse(
				0,
				"No data",
				0.0,
				0,
				"—",
				peakHours,
				List.of(),
				List.of(),
				0,
				0);
	}

	private int computeSafetyScore(int total, long danger, long warning) {
		if (total == 0) {
			return 0;
		}
		double penalty = (danger * 3.0 + warning * 1.5) / total * 100.0;
		return Math.max(0, Math.min(100, (int) Math.round(100.0 - penalty)));
	}

	private String labelForScore(int score) {
		if (score >= 80) {
			return "Nominal";
		}
		if (score >= 55) {
			return "Caution";
		}
		return "Elevated risk";
	}

	private List<PeakHourItem> buildPeakHours(List<PeakHourAggregateRow> rows) {
		Map<Integer, Long> counts = new HashMap<>();
		for (int hour : PEAK_HOUR_BUCKETS) {
			counts.put(hour, 0L);
		}

		for (PeakHourAggregateRow row : rows) {
			int bucket = nearestBucket(row.getHourOfDay());
			counts.merge(bucket, row.getPersonSum(), Long::sum);
		}

		long max = counts.values().stream().mapToLong(Long::longValue).max().orElse(0L);
		List<PeakHourItem> items = new ArrayList<>();
		for (int hour : PEAK_HOUR_BUCKETS) {
			long count = counts.getOrDefault(hour, 0L);
			int height = max == 0 ? 0 : (int) Math.round((count * 100.0) / max);
			items.add(new PeakHourItem(String.format(Locale.US, "%02d:00", hour), height, height >= 80));
		}
		return items;
	}

	private int nearestBucket(int hour) {
		int best = PEAK_HOUR_BUCKETS[0];
		int bestDistance = Integer.MAX_VALUE;
		for (int bucket : PEAK_HOUR_BUCKETS) {
			int distance = Math.abs(bucket - hour);
			if (distance < bestDistance) {
				bestDistance = distance;
				best = bucket;
			}
		}
		return best;
	}

	private String busiestWindow(List<PeakHourItem> peakHours) {
		return peakHours.stream()
				.filter(PeakHourItem::peak)
				.map(PeakHourItem::label)
				.findFirst()
				.orElse(peakHours.stream()
						.max(Comparator.comparingInt(PeakHourItem::heightPercent))
						.map(PeakHourItem::label)
						.orElse("—"));
	}

	private List<ZoneRiskItem> buildZoneRisks(List<FrameRiskAggregateRow> rows) {
		Map<String, long[]> bySource = new LinkedHashMap<>();
		for (FrameRiskAggregateRow row : rows) {
			long[] counts = bySource.computeIfAbsent(row.getSourceType(), key -> new long[3]);
			long frameCount = row.getFrameCount();
			if ("DANGER".equals(row.getMaxProximityRisk())) {
				counts[0] += frameCount;
			} else if ("WARNING".equals(row.getMaxProximityRisk())) {
				counts[1] += frameCount;
			}
			counts[2] += frameCount;
		}

		return bySource.entrySet().stream()
				.sorted(Map.Entry.comparingByKey())
				.map(entry -> {
					long danger = entry.getValue()[0];
					long warning = entry.getValue()[1];
					long total = entry.getValue()[2];
					int percent = total == 0
							? 0
							: (int) Math.round(((danger * 2.0 + warning) / total) * 100.0);
					percent = Math.min(100, percent);
					String level = percent >= 70 ? "HIGH RISK" : percent >= 35 ? "MODERATE" : "LOW RISK";
					return new ZoneRiskItem(formatSourceLabel(entry.getKey()), level, percent, true);
				})
				.toList();
	}

	private String formatSourceLabel(String sourceType) {
		return switch (sourceType) {
			case "WEBCAM" -> "Webcam sessions (source type)";
			case "UPLOAD" -> "Upload sessions (source type)";
			case "MOCK" -> "Mock sessions (source type)";
			default -> sourceType + " (source type)";
		};
	}

	private List<HotspotItem> buildHotspots(List<HotspotAggregateRow> ranked) {
		List<HotspotItem> hotspots = new ArrayList<>();
		int index = 0;
		for (HotspotAggregateRow row : ranked) {
			if (row.getDangerCount() == 0) {
				continue;
			}
			String top = (20 + index * 18) + "%";
			String left = (25 + index * 22) + "%";
			hotspots.add(new HotspotItem(
					"session-" + row.getSessionId(),
					row.getClientLabel() + " (illustrative layout)",
					row.getDangerCount() + " danger frames",
					"DANGER",
					top,
					left,
					true));
			index++;
		}
		return hotspots;
	}
}

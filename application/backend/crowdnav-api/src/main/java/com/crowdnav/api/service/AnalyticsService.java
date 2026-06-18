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
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.crowdnav.api.dto.analytics.AnalyticsSummaryResponse;
import com.crowdnav.api.dto.analytics.HotspotItem;
import com.crowdnav.api.dto.analytics.PeakHourItem;
import com.crowdnav.api.dto.analytics.ZoneRiskItem;
import com.crowdnav.api.persistence.entity.AnalysisSession;
import com.crowdnav.api.persistence.entity.Frame;
import com.crowdnav.api.persistence.repository.AnalysisSessionRepository;
import com.crowdnav.api.persistence.repository.FrameRepository;

@Service
@Transactional(readOnly = true)
public class AnalyticsService {

	private static final int[] PEAK_HOUR_BUCKETS = { 8, 10, 12, 14, 16, 18, 20 };
	private static final DateTimeFormatter HOUR_LABEL = DateTimeFormatter.ofPattern("HH:mm");

	private final FrameRepository frameRepository;
	private final AnalysisSessionRepository sessionRepository;

	public AnalyticsService(FrameRepository frameRepository, AnalysisSessionRepository sessionRepository) {
		this.frameRepository = frameRepository;
		this.sessionRepository = sessionRepository;
	}

	public AnalyticsSummaryResponse buildSummary(int days) {
		int safeDays = Math.clamp(days, 1, 30);
		Instant since = Instant.now().minus(safeDays, ChronoUnit.DAYS);
		Instant priorSince = Instant.now().minus(safeDays * 2L, ChronoUnit.DAYS);

		List<Frame> frames = frameRepository.findRecentWithSession(since);
		long sessionCount = frames.stream()
				.map(Frame::getSession)
				.map(AnalysisSession::getId)
				.distinct()
				.count();

		if (frames.isEmpty()) {
			return emptySummary();
		}

		long dangerCount = countRisk(frames, "DANGER");
		long warningCount = countRisk(frames, "WARNING");
		int safetyScore = computeSafetyScore(frames.size(), dangerCount, warningCount);
		String safetyLabel = labelForScore(safetyScore);

		long priorDanger = frameRepository.findRecentWithSession(priorSince).stream()
				.filter(frame -> frame.getCapturedAt().isBefore(since))
				.filter(frame -> "DANGER".equals(frame.getMaxProximityRisk()))
				.count();
		double trendPercent = priorDanger == 0
				? (dangerCount > 0 ? 100.0 : 0.0)
				: ((dangerCount - priorDanger) * 100.0) / priorDanger;

		List<PeakHourItem> peakHours = buildPeakHours(frames);
		String busiestWindow = busiestWindow(peakHours);
		List<ZoneRiskItem> zoneRisks = buildZoneRisks(frames);
		List<HotspotItem> hotspots = buildHotspots(frames);

		return new AnalyticsSummaryResponse(
				safetyScore,
				safetyLabel,
				Math.round(trendPercent * 10.0) / 10.0,
				(int) dangerCount,
				busiestWindow,
				peakHours,
				zoneRisks,
				hotspots,
				frames.size(),
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

	private long countRisk(List<Frame> frames, String risk) {
		return frames.stream().filter(frame -> risk.equals(frame.getMaxProximityRisk())).count();
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

	private List<PeakHourItem> buildPeakHours(List<Frame> frames) {
		Map<Integer, Long> counts = new HashMap<>();
		for (int hour : PEAK_HOUR_BUCKETS) {
			counts.put(hour, 0L);
		}

		ZoneId zone = ZoneId.systemDefault();
		for (Frame frame : frames) {
			int hour = frame.getCapturedAt().atZone(zone).getHour();
			int bucket = nearestBucket(hour);
			counts.merge(bucket, (long) frame.getPersonCount(), Long::sum);
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

	private List<ZoneRiskItem> buildZoneRisks(List<Frame> frames) {
		Map<String, List<Frame>> bySource = frames.stream()
				.collect(Collectors.groupingBy(frame -> frame.getSession().getSourceType().name()));

		return bySource.entrySet().stream()
				.sorted(Map.Entry.comparingByKey())
				.map(entry -> {
					List<Frame> group = entry.getValue();
					long danger = countRisk(group, "DANGER");
					long warning = countRisk(group, "WARNING");
					int percent = (int) Math.round(((danger * 2.0 + warning) / group.size()) * 100.0);
					percent = Math.min(100, percent);
					String level = percent >= 70 ? "HIGH RISK" : percent >= 35 ? "MODERATE" : "LOW RISK";
					return new ZoneRiskItem(formatSourceLabel(entry.getKey()), level, percent);
				})
				.toList();
	}

	private String formatSourceLabel(String sourceType) {
		return switch (sourceType) {
			case "WEBCAM" -> "Webcam sessions";
			case "UPLOAD" -> "Upload sessions";
			case "MOCK" -> "Mock sessions";
			default -> sourceType;
		};
	}

	private List<HotspotItem> buildHotspots(List<Frame> frames) {
		Map<Long, Long> dangerBySession = new LinkedHashMap<>();
		Map<Long, String> labelBySession = new HashMap<>();

		for (Frame frame : frames) {
			AnalysisSession session = frame.getSession();
			labelBySession.putIfAbsent(session.getId(), session.getClientLabel());
			if ("DANGER".equals(frame.getMaxProximityRisk())) {
				dangerBySession.merge(session.getId(), 1L, Long::sum);
			}
		}

		List<Map.Entry<Long, Long>> ranked = dangerBySession.entrySet().stream()
				.sorted(Map.Entry.<Long, Long>comparingByValue().reversed())
				.limit(3)
				.toList();

		List<HotspotItem> hotspots = new ArrayList<>();
		int index = 0;
		for (Map.Entry<Long, Long> entry : ranked) {
			long dangerFrames = entry.getValue();
			if (dangerFrames == 0) {
				continue;
			}
			String top = (20 + index * 18) + "%";
			String left = (25 + index * 22) + "%";
			hotspots.add(new HotspotItem(
					"session-" + entry.getKey(),
					labelBySession.getOrDefault(entry.getKey(), "Session " + entry.getKey()),
					Math.min(99, (int) dangerFrames * 8) + "% CAPACITY",
					"DANGER",
					top,
					left));
			index++;
		}
		return hotspots;
	}
}

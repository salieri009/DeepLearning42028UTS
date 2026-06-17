package com.crowdnav.api.persistence.mapper;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import com.crowdnav.api.dto.AnalyzeFrameResponse;
import com.crowdnav.api.dto.BBox;
import com.crowdnav.api.dto.PersonDetection;
import com.crowdnav.api.persistence.embeddable.BBoxEmbeddable;
import com.crowdnav.api.persistence.entity.AnalysisSession;
import com.crowdnav.api.persistence.entity.Detection;
import com.crowdnav.api.persistence.entity.Frame;
import com.crowdnav.api.persistence.entity.SourceType;

public final class PersistenceMapper {

	private PersistenceMapper() {
	}

	public static Frame toFrame(
			AnalysisSession session,
			int sequenceNo,
			AnalyzeFrameResponse response,
			int latencyMs) {
		List<PersonDetection> persons = response.persons() != null ? response.persons() : List.of();
		Frame frame = new Frame(
				session,
				sequenceNo,
				Instant.now(),
				latencyMs,
				response.crowdDensity(),
				response.maxProximityRisk(),
				response.recommendation(),
				persons.size());

		for (PersonDetection person : persons) {
			BBox bbox = person.bbox();
			frame.addDetection(new Detection(
					person.clazz(),
					BigDecimal.valueOf(person.confidence()).setScale(4, RoundingMode.HALF_UP),
					new BBoxEmbeddable(
							toDecimal(bbox.xCenter()),
							toDecimal(bbox.yCenter()),
							toDecimal(bbox.width()),
							toDecimal(bbox.height())),
					person.proximityRisk()));
		}
		return frame;
	}

	public static SourceType parseSourceType(String value) {
		return SourceType.valueOf(value);
	}

	public static String worstRisk(List<String> risks) {
		int worst = 0;
		for (String risk : risks) {
			worst = Math.max(worst, riskOrdinal(risk));
		}
		return switch (worst) {
			case 2 -> "DANGER";
			case 1 -> "WARNING";
			default -> "SAFE";
		};
	}

	private static int riskOrdinal(String risk) {
		if (risk == null) {
			return 0;
		}
		return switch (risk) {
			case "DANGER" -> 2;
			case "WARNING" -> 1;
			default -> 0;
		};
	}

	private static BigDecimal toDecimal(double value) {
		return BigDecimal.valueOf(value).setScale(4, RoundingMode.HALF_UP);
	}
}

package com.crowdnav.api.persistence.entity;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

@Entity
@Table(name = "frame")
public class Frame {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "session_id", nullable = false)
	private AnalysisSession session;

	@Column(name = "sequence_no", nullable = false)
	private int sequenceNo;

	@Column(name = "captured_at", nullable = false)
	private Instant capturedAt;

	@Column(name = "latency_ms")
	private Integer latencyMs;

	@Column(name = "crowd_density", nullable = false, length = 8)
	private String crowdDensity;

	@Column(name = "max_proximity_risk", nullable = false, length = 8)
	private String maxProximityRisk;

	@Column(nullable = false, length = 8)
	private String recommendation;

	@Column(name = "person_count", nullable = false)
	private int personCount;

	@OneToMany(mappedBy = "frame", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<Detection> detections = new ArrayList<>();

	protected Frame() {
	}

	public Frame(
			AnalysisSession session,
			int sequenceNo,
			Instant capturedAt,
			Integer latencyMs,
			String crowdDensity,
			String maxProximityRisk,
			String recommendation,
			int personCount) {
		this.session = session;
		this.sequenceNo = sequenceNo;
		this.capturedAt = capturedAt;
		this.latencyMs = latencyMs;
		this.crowdDensity = crowdDensity;
		this.maxProximityRisk = maxProximityRisk;
		this.recommendation = recommendation;
		this.personCount = personCount;
	}

	public Long getId() {
		return id;
	}

	public AnalysisSession getSession() {
		return session;
	}

	public int getSequenceNo() {
		return sequenceNo;
	}

	public Instant getCapturedAt() {
		return capturedAt;
	}

	public Integer getLatencyMs() {
		return latencyMs;
	}

	public String getCrowdDensity() {
		return crowdDensity;
	}

	public String getMaxProximityRisk() {
		return maxProximityRisk;
	}

	public String getRecommendation() {
		return recommendation;
	}

	public int getPersonCount() {
		return personCount;
	}

	public List<Detection> getDetections() {
		return detections;
	}

	public void addDetection(Detection detection) {
		detections.add(detection);
		detection.setFrame(this);
	}
}

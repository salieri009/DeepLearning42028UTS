package com.crowdnav.api.persistence.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "analysis_session")
public class AnalysisSession {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "started_at", nullable = false)
	private Instant startedAt;

	@Column(name = "ended_at")
	private Instant endedAt;

	@Column(name = "client_label", length = 120)
	private String clientLabel;

	@Enumerated(EnumType.STRING)
	@Column(name = "source_type", nullable = false, length = 16)
	private SourceType sourceType;

	protected AnalysisSession() {
	}

	public AnalysisSession(Instant startedAt, String clientLabel, SourceType sourceType) {
		this.startedAt = startedAt;
		this.clientLabel = clientLabel;
		this.sourceType = sourceType;
	}

	public Long getId() {
		return id;
	}

	public Instant getStartedAt() {
		return startedAt;
	}

	public Instant getEndedAt() {
		return endedAt;
	}

	public void setEndedAt(Instant endedAt) {
		this.endedAt = endedAt;
	}

	public String getClientLabel() {
		return clientLabel;
	}

	public SourceType getSourceType() {
		return sourceType;
	}
}

package com.crowdnav.api.persistence.entity;

import java.math.BigDecimal;

import com.crowdnav.api.persistence.embeddable.BBoxEmbeddable;

import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "detection")
public class Detection {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "frame_id", nullable = false)
	private Frame frame;

	@Column(name = "class_label", nullable = false, length = 16)
	private String classLabel;

	@Column(nullable = false, precision = 5, scale = 4)
	private BigDecimal confidence;

	@Embedded
	private BBoxEmbeddable bbox;

	@Column(name = "proximity_risk", length = 8)
	private String proximityRisk;

	protected Detection() {
	}

	public Detection(String classLabel, BigDecimal confidence, BBoxEmbeddable bbox, String proximityRisk) {
		this.classLabel = classLabel;
		this.confidence = confidence;
		this.bbox = bbox;
		this.proximityRisk = proximityRisk;
	}

	public Long getId() {
		return id;
	}

	public Frame getFrame() {
		return frame;
	}

	void setFrame(Frame frame) {
		this.frame = frame;
	}

	public String getClassLabel() {
		return classLabel;
	}

	public BigDecimal getConfidence() {
		return confidence;
	}

	public BBoxEmbeddable getBbox() {
		return bbox;
	}

	public String getProximityRisk() {
		return proximityRisk;
	}
}

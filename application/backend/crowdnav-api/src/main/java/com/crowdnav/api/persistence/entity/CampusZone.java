package com.crowdnav.api.persistence.entity;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "campus_zone")
public class CampusZone {

	@Id
	@Column(length = 32)
	private String id;

	@Column(nullable = false, length = 120)
	private String label;

	@Column(nullable = false, precision = 9, scale = 6)
	private BigDecimal lat;

	@Column(nullable = false, precision = 9, scale = 6)
	private BigDecimal lng;

	protected CampusZone() {
	}

	public String getId() {
		return id;
	}

	public String getLabel() {
		return label;
	}

	public BigDecimal getLat() {
		return lat;
	}

	public BigDecimal getLng() {
		return lng;
	}
}

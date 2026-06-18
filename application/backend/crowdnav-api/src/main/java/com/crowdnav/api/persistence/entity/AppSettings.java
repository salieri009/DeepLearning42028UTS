package com.crowdnav.api.persistence.entity;

import java.time.Instant;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "app_settings")
public class AppSettings {

	@Id
	private int id = 1;

	@JdbcTypeCode(SqlTypes.JSON)
	@Column(nullable = false, columnDefinition = "jsonb")
	private String payload;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected AppSettings() {
	}

	public AppSettings(String payload, Instant updatedAt) {
		this.payload = payload;
		this.updatedAt = updatedAt;
	}

	public int getId() {
		return id;
	}

	public String getPayload() {
		return payload;
	}

	public void setPayload(String payload) {
		this.payload = payload;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

	public void setUpdatedAt(Instant updatedAt) {
		this.updatedAt = updatedAt;
	}
}

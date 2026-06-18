package com.crowdnav.api.persistence.projection;

public interface FrameRiskAggregateRow {

	String getSourceType();

	String getMaxProximityRisk();

	long getFrameCount();
}

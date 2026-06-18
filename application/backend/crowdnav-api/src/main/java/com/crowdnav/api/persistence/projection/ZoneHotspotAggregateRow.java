package com.crowdnav.api.persistence.projection;

public interface ZoneHotspotAggregateRow {

	String getZoneId();

	long getDangerCount();

	long getWarningCount();
}

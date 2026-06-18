package com.crowdnav.api.persistence.projection;

public interface HotspotAggregateRow {

	Long getSessionId();

	String getClientLabel();

	long getDangerCount();
}

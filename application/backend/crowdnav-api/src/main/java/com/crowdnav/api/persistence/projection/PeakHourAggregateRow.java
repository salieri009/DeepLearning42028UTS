package com.crowdnav.api.persistence.projection;

public interface PeakHourAggregateRow {

	int getHourOfDay();

	long getPersonSum();
}

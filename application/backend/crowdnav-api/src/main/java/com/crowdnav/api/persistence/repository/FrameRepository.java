package com.crowdnav.api.persistence.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.crowdnav.api.persistence.entity.Frame;
import com.crowdnav.api.persistence.projection.FrameRiskAggregateRow;
import com.crowdnav.api.persistence.projection.PeakHourAggregateRow;
import com.crowdnav.api.persistence.projection.ZoneHotspotAggregateRow;

public interface FrameRepository extends JpaRepository<Frame, Long> {

	long countBySessionId(Long sessionId);

	List<Frame> findBySessionIdOrderBySequenceNoAsc(Long sessionId);

	List<Frame> findBySessionIdOrderBySequenceNoAsc(Long sessionId, Pageable pageable);

	@Query("SELECT COALESCE(MAX(f.sequenceNo), -1) FROM Frame f WHERE f.session.id = :sessionId")
	Optional<Integer> findMaxSequenceNoBySessionId(@Param("sessionId") Long sessionId);

	@Query("SELECT AVG(f.latencyMs) FROM Frame f WHERE f.session.id = :sessionId AND f.latencyMs IS NOT NULL")
	Double findAvgLatencyMsBySessionId(@Param("sessionId") Long sessionId);

	@Query("SELECT f.maxProximityRisk FROM Frame f WHERE f.session.id = :sessionId")
	List<String> findMaxProximityRisksBySessionId(@Param("sessionId") Long sessionId);

	@Query("""
			SELECT f FROM Frame f
			JOIN FETCH f.session s
			WHERE f.capturedAt >= :since
			ORDER BY f.capturedAt ASC
			""")
	List<Frame> findRecentWithSession(@Param("since") Instant since);

	long countByCapturedAtGreaterThanEqual(Instant since);

	long countByCapturedAtGreaterThanEqualAndMaxProximityRisk(Instant since, String risk);

	long countByCapturedAtGreaterThanEqualAndCapturedAtLessThanAndMaxProximityRisk(
			Instant since, Instant until, String risk);

	@Query("""
			SELECT COUNT(DISTINCT f.session.id)
			FROM Frame f
			WHERE f.capturedAt >= :since
			""")
	long countDistinctSessionsSince(@Param("since") Instant since);

	@Query("""
			SELECT f.session.sourceType AS sourceType,
			       f.maxProximityRisk AS maxProximityRisk,
			       COUNT(f) AS frameCount
			FROM Frame f
			WHERE f.capturedAt >= :since
			GROUP BY f.session.sourceType, f.maxProximityRisk
			""")
	List<FrameRiskAggregateRow> aggregateRiskBySourceSince(@Param("since") Instant since);

	@Query("""
			SELECT f.session.zone.id AS zoneId,
			       SUM(CASE WHEN f.maxProximityRisk = 'DANGER' THEN 1 ELSE 0 END) AS dangerCount,
			       SUM(CASE WHEN f.maxProximityRisk = 'WARNING' THEN 1 ELSE 0 END) AS warningCount
			FROM Frame f
			WHERE f.capturedAt >= :since
			GROUP BY f.session.zone.id
			HAVING SUM(CASE WHEN f.maxProximityRisk = 'DANGER' THEN 1 ELSE 0 END) > 0
			ORDER BY SUM(CASE WHEN f.maxProximityRisk = 'DANGER' THEN 1 ELSE 0 END) DESC
			""")
	List<ZoneHotspotAggregateRow> aggregateDangerHotspotsByZoneSince(@Param("since") Instant since);

	@Query(value = """
			SELECT CAST(EXTRACT(HOUR FROM f.captured_at) AS INT) AS hourOfDay,
			       COALESCE(SUM(f.person_count), 0) AS personSum
			FROM frame f
			WHERE f.captured_at >= :since
			GROUP BY EXTRACT(HOUR FROM f.captured_at)
			""", nativeQuery = true)
	List<PeakHourAggregateRow> aggregatePeakHoursSince(@Param("since") Instant since);
}

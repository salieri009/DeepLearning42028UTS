package com.crowdnav.api.persistence.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.crowdnav.api.persistence.entity.Frame;

public interface FrameRepository extends JpaRepository<Frame, Long> {

	long countBySessionId(Long sessionId);

	List<Frame> findBySessionIdOrderBySequenceNoAsc(Long sessionId);

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
}

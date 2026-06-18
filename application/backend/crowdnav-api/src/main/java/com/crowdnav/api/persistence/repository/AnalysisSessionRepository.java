package com.crowdnav.api.persistence.repository;

import java.time.Instant;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.crowdnav.api.persistence.entity.AnalysisSession;

public interface AnalysisSessionRepository extends JpaRepository<AnalysisSession, Long> {

	@Query(value = """
			SELECT
			  s.id,
			  s.started_at,
			  s.ended_at,
			  s.client_label,
			  s.source_type,
			  COALESCE(agg.frame_count, 0),
			  agg.avg_latency_ms,
			  COALESCE(agg.danger_cnt, 0),
			  COALESCE(agg.warning_cnt, 0)
			FROM analysis_session s
			LEFT JOIN (
			  SELECT
			    session_id,
			    COUNT(*) AS frame_count,
			    AVG(latency_ms) AS avg_latency_ms,
			    SUM(CASE WHEN max_proximity_risk = 'DANGER' THEN 1 ELSE 0 END) AS danger_cnt,
			    SUM(CASE WHEN max_proximity_risk = 'WARNING' THEN 1 ELSE 0 END) AS warning_cnt
			  FROM frame
			  GROUP BY session_id
			) agg ON agg.session_id = s.id
			WHERE (:startedAfter IS NULL OR s.started_at >= :startedAfter)
			  AND (:sourceType IS NULL OR s.source_type = :sourceType)
			  AND (
			    :worstRisk IS NULL OR (
			      CASE
			        WHEN COALESCE(agg.danger_cnt, 0) > 0 THEN 'DANGER'
			        WHEN COALESCE(agg.warning_cnt, 0) > 0 THEN 'WARNING'
			        ELSE 'SAFE'
			      END
			    ) = :worstRisk
			  )
			ORDER BY s.started_at DESC
			LIMIT :limit OFFSET :offset
			""", nativeQuery = true)
	List<Object[]> findFilteredSummaryRows(
			@Param("startedAfter") Instant startedAfter,
			@Param("sourceType") String sourceType,
			@Param("worstRisk") String worstRisk,
			@Param("limit") int limit,
			@Param("offset") int offset);

	@Query(value = """
			SELECT COUNT(*)
			FROM analysis_session s
			LEFT JOIN (
			  SELECT
			    session_id,
			    SUM(CASE WHEN max_proximity_risk = 'DANGER' THEN 1 ELSE 0 END) AS danger_cnt,
			    SUM(CASE WHEN max_proximity_risk = 'WARNING' THEN 1 ELSE 0 END) AS warning_cnt
			  FROM frame
			  GROUP BY session_id
			) agg ON agg.session_id = s.id
			WHERE (:startedAfter IS NULL OR s.started_at >= :startedAfter)
			  AND (:sourceType IS NULL OR s.source_type = :sourceType)
			  AND (
			    :worstRisk IS NULL OR (
			      CASE
			        WHEN COALESCE(agg.danger_cnt, 0) > 0 THEN 'DANGER'
			        WHEN COALESCE(agg.warning_cnt, 0) > 0 THEN 'WARNING'
			        ELSE 'SAFE'
			      END
			    ) = :worstRisk
			  )
			""", nativeQuery = true)
	long countFilteredSummaries(
			@Param("startedAfter") Instant startedAfter,
			@Param("sourceType") String sourceType,
			@Param("worstRisk") String worstRisk);
}

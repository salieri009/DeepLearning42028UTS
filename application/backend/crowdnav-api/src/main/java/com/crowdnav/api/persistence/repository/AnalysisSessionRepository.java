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
			    f.session_id,
			    COUNT(*) AS frame_count,
			    AVG(f.latency_ms) AS avg_latency_ms,
			    SUM(CASE WHEN f.max_proximity_risk = 'DANGER' THEN 1 ELSE 0 END) AS danger_cnt,
			    SUM(CASE WHEN f.max_proximity_risk = 'WARNING' THEN 1 ELSE 0 END) AS warning_cnt
			  FROM frame f
			  INNER JOIN analysis_session s_filter ON s_filter.id = f.session_id
			  WHERE s_filter.started_at >= :startedAfter
			    AND (:sourceType = '' OR s_filter.source_type = :sourceType)
			  GROUP BY f.session_id
			) agg ON agg.session_id = s.id
			WHERE s.started_at >= :startedAfter
			  AND (:sourceType = '' OR s.source_type = :sourceType)
			  AND (
			    :worstRisk = '' OR (
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
			    f.session_id,
			    SUM(CASE WHEN f.max_proximity_risk = 'DANGER' THEN 1 ELSE 0 END) AS danger_cnt,
			    SUM(CASE WHEN f.max_proximity_risk = 'WARNING' THEN 1 ELSE 0 END) AS warning_cnt
			  FROM frame f
			  INNER JOIN analysis_session s_filter ON s_filter.id = f.session_id
			  WHERE s_filter.started_at >= :startedAfter
			    AND (:sourceType = '' OR s_filter.source_type = :sourceType)
			  GROUP BY f.session_id
			) agg ON agg.session_id = s.id
			WHERE s.started_at >= :startedAfter
			  AND (:sourceType = '' OR s.source_type = :sourceType)
			  AND (
			    :worstRisk = '' OR (
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
			  WHERE session_id = :sessionId
			  GROUP BY session_id
			) agg ON agg.session_id = s.id
			WHERE s.id = :sessionId
			""", nativeQuery = true)
	List<Object[]> findSessionSummaryRowsById(@Param("sessionId") Long sessionId);
}

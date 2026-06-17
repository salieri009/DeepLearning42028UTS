package com.crowdnav.api.persistence.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.crowdnav.api.persistence.entity.AnalysisSession;

public interface AnalysisSessionRepository extends JpaRepository<AnalysisSession, Long> {

	@Query(value = """
			SELECT * FROM analysis_session
			ORDER BY started_at DESC
			LIMIT :limit OFFSET :offset
			""", nativeQuery = true)
	List<AnalysisSession> findSlice(@Param("limit") int limit, @Param("offset") int offset);
}

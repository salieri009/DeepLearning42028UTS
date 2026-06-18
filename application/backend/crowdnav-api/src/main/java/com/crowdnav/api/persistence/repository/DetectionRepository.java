package com.crowdnav.api.persistence.repository;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.crowdnav.api.persistence.entity.Detection;

public interface DetectionRepository extends JpaRepository<Detection, Long> {

	@Query("""
			SELECT d FROM Detection d
			JOIN FETCH d.frame f
			WHERE f.session.id = :sessionId
			AND (:risk IS NULL OR d.proximityRisk = :risk)
			AND (:classLabel IS NULL OR d.classLabel = :classLabel)
			ORDER BY f.sequenceNo ASC, d.id ASC
			""")
	List<Detection> findBySessionIdFiltered(
			@Param("sessionId") Long sessionId,
			@Param("risk") String risk,
			@Param("classLabel") String classLabel,
			Pageable pageable);
}

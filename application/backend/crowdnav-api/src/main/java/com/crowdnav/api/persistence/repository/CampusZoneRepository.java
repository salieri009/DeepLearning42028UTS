package com.crowdnav.api.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.crowdnav.api.persistence.entity.CampusZone;

public interface CampusZoneRepository extends JpaRepository<CampusZone, String> {
}

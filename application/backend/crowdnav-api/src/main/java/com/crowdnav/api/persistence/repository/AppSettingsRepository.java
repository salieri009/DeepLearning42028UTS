package com.crowdnav.api.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.crowdnav.api.persistence.entity.AppSettings;

public interface AppSettingsRepository extends JpaRepository<AppSettings, Integer> {
}

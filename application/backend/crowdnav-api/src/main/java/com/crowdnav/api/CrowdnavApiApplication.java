package com.crowdnav.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

import com.crowdnav.api.config.FrameUploadProperties;

@SpringBootApplication
@EnableConfigurationProperties(FrameUploadProperties.class)
public class CrowdnavApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(CrowdnavApiApplication.class, args);
	}

}

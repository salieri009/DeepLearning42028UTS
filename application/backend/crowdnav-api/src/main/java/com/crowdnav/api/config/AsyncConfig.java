package com.crowdnav.api.config;

import java.util.concurrent.Executor;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {

	private static final int CORE_POOL = 2;
	private static final int MAX_POOL = 4;
	private static final int QUEUE_CAPACITY = 50;

	@Bean(name = "framePersistenceExecutor")
	public Executor framePersistenceExecutor() {
		ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
		executor.setCorePoolSize(CORE_POOL);
		executor.setMaxPoolSize(MAX_POOL);
		executor.setQueueCapacity(QUEUE_CAPACITY);
		executor.setThreadNamePrefix("frame-persist-");
		executor.initialize();
		return executor;
	}

	@Override
	public Executor getAsyncExecutor() {
		return framePersistenceExecutor();
	}
}

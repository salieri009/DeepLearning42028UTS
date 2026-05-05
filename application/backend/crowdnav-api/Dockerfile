# =============================================================================
# CrowdNav backend (Spring Boot 3.5.6, Java 21) — multi-stage build
#   Stage 1: Gradle build → executable bootJar
#   Stage 2: JRE 21 runtime
# Build context: application/backend/crowdnav-api/
# Aligned with ADR-0002 (Spring as backend) + ADR-0003 (Docker packaging).
# =============================================================================

# ----- Stage 1: build -----
FROM gradle:8.10.2-jdk21 AS build
WORKDIR /workspace

# Cache deps: copy gradle config first
COPY build.gradle settings.gradle ./
COPY gradle ./gradle
COPY gradlew ./

# Pre-fetch dependencies (best-effort; non-fatal if no tasks resolve)
RUN gradle --no-daemon dependencies > /dev/null 2>&1 || true

# Copy sources and build the executable bootJar
COPY src ./src
RUN gradle --no-daemon clean bootJar -x test

# ----- Stage 2: runtime -----
FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /opt/app

# Run as a non-root user
RUN addgroup -S spring && adduser -S spring -G spring

COPY --from=build /workspace/build/libs/*.jar /opt/app/app.jar
RUN chown -R spring:spring /opt/app
USER spring

# Container env defaults — overridable via docker-compose.
# `app.inference.mode=remote` flips Spring to call the inference-service over HTTP.
ENV SERVER_PORT=8080 \
    SPRING_PROFILES_ACTIVE=docker \
    APP_INFERENCE_MODE=remote \
    APP_INFERENCE_URL=http://inference:9000

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
    CMD wget -qO- http://localhost:8080/actuator/health 2>/dev/null \
        || wget -qO- http://localhost:8080/ 2>/dev/null \
        || exit 1

ENTRYPOINT ["java", "-jar", "/opt/app/app.jar"]

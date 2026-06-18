# =============================================================================
# CrowdNav frontend v2.6.0 (React + Vite) — multi-stage build
#   Stage 1: build Vite static bundle
#   Stage 2: serve via Nginx (nginx.conf: /api + /actuator proxy)
# Build context: application/frontend/
# =============================================================================

# ----- Stage 1: build -----
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

# ----- Stage 2: serve -----
FROM nginx:1.27-alpine AS serve

LABEL org.opencontainers.image.title="crowdnav-frontend" \
      org.opencontainers.image.version="2.6.0"

RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/crowdnav.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]

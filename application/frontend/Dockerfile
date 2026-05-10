# =============================================================================
# CrowdNav frontend (React + Vite) — multi-stage build
#   Stage 1: build Vite static bundle
#   Stage 2: serve via Nginx
# Build context: application/frontend/
# Aligned with ADR-0003 (Docker = webapp packaging).
# =============================================================================

# ----- Stage 1: build -----
FROM node:20-alpine AS build
WORKDIR /app

# Cache deps separately from sources
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# Build-time env: Vite reads VITE_* vars at compile time.
# Default to /api so the Nginx reverse-proxy below routes to the Spring backend.
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

# ----- Stage 2: serve -----
FROM nginx:1.27-alpine AS serve

# Custom nginx config: SPA fallback + /api reverse-proxy to backend service
RUN rm -f /etc/nginx/conf.d/default.conf
COPY <<'NGINX_CONF' /etc/nginx/conf.d/crowdnav.conf
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Reverse-proxy /api/* to the Spring backend service (compose service name).
    location /api/ {
        proxy_pass http://backend:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 30s;
    }
}
NGINX_CONF

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]

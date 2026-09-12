FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
ENV PUPPETEER_SKIP_DOWNLOAD=1
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/* && npm ci
COPY . .
ENV DISABLE_PWA=1
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
RUN node tools/build.js 2>&1 && ls -la /app/dist/ /app/dist/assets/ | head -5

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
RUN groupadd -r appgroup && useradd -r -g appgroup -m appuser
# Install git for backups
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ git ca-certificates && \
    update-ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./
ENV PUPPETEER_SKIP_DOWNLOAD=1
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY run.sh ./
RUN chmod +x run.sh

RUN mkdir -p /app/server/data /app/server/backup-repo && chown -R appuser:appgroup /app/server/data /app/server/backup-repo && chown appuser:appgroup run.sh
ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:4000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
USER appuser
CMD ["/app/run.sh"]

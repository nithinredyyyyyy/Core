FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
ENV PUPPETEER_SKIP_DOWNLOAD=1
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/* && npm ci
COPY . .
RUN npx vite build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
RUN groupadd -r appgroup && useradd -r -g appgroup -m appuser
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
ENV PUPPETEER_SKIP_DOWNLOAD=1
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:4000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
USER appuser
CMD ["npm", "start"]

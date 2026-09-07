FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
ENV PUPPETEER_SKIP_DOWNLOAD=1
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
RUN groupadd -r appgroup && useradd -r -g appgroup -m appuser
COPY package*.json ./
ENV PUPPETEER_SKIP_DOWNLOAD=1
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY --from=build /app/src/lib ./src/lib
COPY --from=build /app/src/features ./src/features
COPY --from=build /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3
COPY --from=build /app/node_modules/libsql ./node_modules/libsql
COPY --from=build /app/node_modules/.package-lock.json ./node_modules/.package-lock.json
ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000
USER appuser
CMD ["npm", "start"]

FROM node:22-bookworm-slim

WORKDIR /app

COPY package*.json ./
ENV PUPPETEER_SKIP_DOWNLOAD=1
RUN npm ci

COPY . .

RUN npm run build

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["npm", "start"]

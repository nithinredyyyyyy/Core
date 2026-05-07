# StageCore

StageCore is an esports tournament site with a Vite frontend and an Express + SQLite backend. The admin panel manages tournaments, teams, players, matches, results, and news, and the public pages read from the same live database.

## Stack

- Frontend: React, Vite, Tailwind
- Backend: Express
- Database: SQLite via `better-sqlite3`

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Start the API server in one terminal:

```bash
npm run server
```

3. Start the frontend in another terminal:

```bash
npm run dev
```

The frontend runs on Vite's default port and proxies `/api` calls to `http://localhost:4000`.

## Build

```bash
npm run build
```

## Deploy

Build the frontend, then run the Express server:

```bash
npm run build
npm start
```

The server now serves the built SPA from `dist/` and the API from the same host, so a single Node deployment works well on platforms like Render, Railway, or a VPS.

Recommended production settings:

- `PORT`: supplied by your host, or default `4000`
- `CORE_ADMIN_KEY`: required if you want remote admin writes outside localhost
- `FRONTEND_ORIGIN`: set this when the frontend is hosted on a different domain from the API, for example a Vercel frontend calling a Render backend
- `VITE_API_BASE_URL`: set this in the frontend host when the API is deployed separately, for example `https://your-backend.onrender.com`

If you deploy on an ephemeral filesystem, persist the SQLite file in `server/data/stagecore.sqlite` on a mounted disk or move to a managed database.

### Free split-host deploy

Recommended zero-cost preview setup:

- Frontend: Vercel
- Backend: Render

For that setup:

1. Deploy the backend to Render with:
   - `NODE_ENV=production`
   - `PORT=4000`
   - `CORE_ADMIN_KEY=your-secret`
   - `FRONTEND_ORIGIN=https://your-frontend.vercel.app`
2. Deploy the frontend to Vercel with:
   - `VITE_API_BASE_URL=https://your-backend.onrender.com`

Local development still uses the Vite `/api` proxy automatically.

### VPS deploy

This repo is now ready for a simple single-host deploy.

Recommended stack:

- Ubuntu VPS
- Node 22
- PM2
- Nginx

Steps:

```bash
npm install
npm run build
npm install -g pm2
pm2 start ecosystem.config.cjs
```

Then use the sample Nginx config in [deploy.nginx.conf](/C:/Users/surak/core/deploy.nginx.conf) to proxy `80 -> 4000`.

### Docker deploy

Build and run:

```bash
docker build -t core-site .
docker run -d -p 4000:4000 --name core-site core-site
```

### Render deploy

A starter Render config is included in [render.yaml](/C:/Users/surak/core/render.yaml).

Important:

- free/ephemeral hosting is okay for preview
- for real admin/data usage, persist `server/data/stagecore.sqlite`
- for remote admin writes, set `CORE_ADMIN_KEY`

## Data storage

- SQLite database file: [server/data/stagecore.sqlite](/C:/Users/surak/core/server/data/stagecore.sqlite)
- API entry: [server/index.js](/C:/Users/surak/core/server/index.js)
- Frontend data client: [SRC/API/BASE44CLIENT.js](/C:/Users/surak/core/SRC/API/BASE44CLIENT.js)

## Notes

- Base44 environment variables are no longer required for the app to run.
- The current admin UI now works against the local API/database rather than Base44.
- For deployment, host the frontend and backend together or configure your production frontend to reach the backend domain.

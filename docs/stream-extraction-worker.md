# Stream Extraction Worker

This worker runs away from your laptop. The StageCore admin panel only queues a
stream session; a cloud VM/container polls the backend, captures small cropped
frames, runs OCR, and pushes structured rows back to the app.

## What It Extracts

For BMPS streams use `STREAM_CROP_PRESET=bmps_marked_feed_stats`.

Left feed crop:

- `remaining`
- `teams_alive`
- `game_time`
- `match_number`
- `group`
- `map`
- roster `player_name` and `individual_finishes`
- kill feed events with killer, victim, weapon, and survival time

Center player stats crop:

- `team_name`
- `player_name`
- `weapons`
- `utility`
- `finishes`
- `damage`
- `assists`

Kill-feed rows use the visible HUD `game_time` as the eliminated player's
`survival_time`.

## Safety

Local worker launches are disabled by default. The backend route
`POST /api/stream-extraction/worker/run-once` only works when:

```bash
STREAM_ENABLE_LOCAL_WORKER_RUN=1
```

Leave that unset on your laptop. Use the cloud worker instead.

## Backend Requirements

Your StageCore backend must be reachable from the cloud worker and must have:

```bash
CORE_ADMIN_KEY=your-secret-admin-key
```

The worker sends this key as `x-core-admin-key`.

## Worker Environment

Use these variables on the cloud worker:

```bash
CORE_ADMIN_KEY=your-secret-admin-key
STREAM_API_BASE_URL=https://your-stagecore-backend.example.com
STREAM_WORKER_NAME=bmps-cloud-worker
STREAM_WORKER_LOOP_MS=15000
STREAM_FRAME_SAMPLE_INTERVAL_SECONDS=2
STREAM_CROP_PRESET=bmps_marked_feed_stats
STREAM_YTDLP_BIN=yt-dlp
STREAM_FFMPEG_BIN=ffmpeg
STREAM_WORKER_OUTPUT_DIR=/tmp/stagecore-stream-worker
```

For best accuracy, use a vision/OCR webhook:

```bash
STREAM_OCR_MODE=webhook
STREAM_OCR_WEBHOOK_URL=https://your-ocr-service.example.com/extract
STREAM_OCR_WEBHOOK_TOKEN=optional-bearer-token
```

Free fallback mode:

```bash
STREAM_OCR_MODE=tesseract
STREAM_TESSERACT_BIN=tesseract
```

Tesseract is okay for simple text, but webhook/vision OCR is much better for
kill feed, weapon icons, utility icons, and busy stream overlays.

## Docker Cloud Worker

Build:

```bash
docker build -f Dockerfile.stream-worker -t stagecore-stream-worker .
```

Run:

```bash
docker run -d --name stagecore-stream-worker \
  -e CORE_ADMIN_KEY="your-secret-admin-key" \
  -e STREAM_API_BASE_URL="https://your-stagecore-backend.example.com" \
  -e STREAM_OCR_MODE="webhook" \
  -e STREAM_OCR_WEBHOOK_URL="https://your-ocr-service.example.com/extract" \
  -e STREAM_OCR_WEBHOOK_TOKEN="optional-bearer-token" \
  stagecore-stream-worker
```

For free OCR:

```bash
docker run -d --name stagecore-stream-worker \
  -e CORE_ADMIN_KEY="your-secret-admin-key" \
  -e STREAM_API_BASE_URL="https://your-stagecore-backend.example.com" \
  -e STREAM_OCR_MODE="tesseract" \
  stagecore-stream-worker
```

## Plain Ubuntu VM

Install dependencies:

```bash
sudo apt-get update
sudo apt-get install -y nodejs npm ffmpeg python3 python3-pip tesseract-ocr
python3 -m pip install --break-system-packages yt-dlp
npm ci
```

Run one check:

```bash
CORE_ADMIN_KEY="your-secret-admin-key" \
STREAM_API_BASE_URL="https://your-stagecore-backend.example.com" \
STREAM_OCR_MODE="webhook" \
STREAM_OCR_WEBHOOK_URL="https://your-ocr-service.example.com/extract" \
node server/streamWorker.js --once
```

Run continuously with PM2:

```bash
npm install -g pm2
CORE_ADMIN_KEY="your-secret-admin-key" \
STREAM_API_BASE_URL="https://your-stagecore-backend.example.com" \
STREAM_OCR_MODE="webhook" \
STREAM_OCR_WEBHOOK_URL="https://your-ocr-service.example.com/extract" \
STREAM_CROP_PRESET="bmps_marked_feed_stats" \
STREAM_FRAME_SAMPLE_INTERVAL_SECONDS="2" \
pm2 start server/streamWorker.js --name stagecore-stream-worker
pm2 save
```

## Admin Workflow

1. Open Admin -> Stream Fetch.
2. Paste the YouTube live/VOD URL.
3. Keep crop preset as `BMPS marked: left feed + center stats`.
4. Queue the session.
5. Do not click local worker on your laptop.
6. Cloud worker picks the queued session and starts pushing OCR rows.
7. Review `OCR capture rows`.
8. Aggregate rows into draft match stats only after the OCR rows look good.

## OCR Webhook Contract

The worker sends one cropped image at a time:

```json
{
  "prompt": "Crop-specific OCR instructions",
  "session": {
    "id": "session-id",
    "youtube_url": "https://youtube.com/live/..."
  },
  "frame_job": {
    "id": "frame-job-id",
    "metadata": {
      "crop_preset": "bmps_left_feed"
    }
  },
  "image": {
    "mime_type": "image/jpeg",
    "base64": "..."
  }
}
```

Left crop response:

```json
{
  "scoreboardVisible": true,
  "match_key": "BMPS 2026 Round 4 Match 6 Group B",
  "match_info": {
    "remaining": 49,
    "teams_alive": 14,
    "game_time": "15:38",
    "match_number": 6,
    "group": "B",
    "map": "Erangel"
  },
  "team_roster": [
    {
      "team_name": "MADKINGS",
      "player_name": "MadSIMPP",
      "individual_finishes": 1,
      "confidence": 0.88
    }
  ],
  "kill_feed_events": [
    {
      "killer_team": "NQSH",
      "killer_player": "Executor",
      "victim_team": "TROY",
      "victim_player": "MaxiosD",
      "weapon": "rifle",
      "action": "eliminated",
      "confidence": 0.82
    }
  ],
  "rows": []
}
```

Center crop response:

```json
{
  "scoreboardVisible": true,
  "player_stats": [
    {
      "team_name": "MADKINGS",
      "player_name": "MadSIMPP",
      "weapons": ["rifle"],
      "utility": ["grenade", "smoke"],
      "finishes": 3,
      "damage": 248,
      "assists": 0,
      "confidence": 0.9
    }
  ],
  "rows": []
}
```

The backend dedupes repeated sightings by event key and increases `sample_count`
instead of creating noisy duplicate rows.

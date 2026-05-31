module.exports = {
  apps: [
    {
      name: "core-site",
      script: "server/index.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "600M",
      env: {
        NODE_ENV: "production",
        PORT: 4000,
      },
    },
    {
      name: "core-stream-worker",
      script: "server/streamWorker.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "800M",
      env: {
        NODE_ENV: "production",
        STREAM_WORKER_NAME: "pm2-bmps-worker",
        STREAM_WORKER_LOOP_MS: 15000,
        STREAM_FRAME_SAMPLE_INTERVAL_SECONDS: 2,
        STREAM_CROP_PRESET: "bmps_marked_feed_stats",
        STREAM_OCR_MODE: "tesseract",
      },
    },
  ],
};

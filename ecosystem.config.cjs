module.exports = {
  apps: [
    {
      name: "core-site",
      script: "server/index.js",
      cwd: "C:/Users/surak/core",
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
  ],
};

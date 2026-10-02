import react from "@vitejs/plugin-react";
import path from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  logLevel: "warn",
  build: { manifest: true },
  cacheDir: path.resolve(__dirname, "node_modules/.vite"),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  plugins: [
    react(),
    process.env.DISABLE_PWA === "1"
      ? null
      : VitePWA({
          registerType: "autoUpdate",
          includeAssets: ["images/core-logo.svg", "pwa-192x192.png", "pwa-512x512.png"],
          workbox: {
            importScripts: ["/sw-cleanup.js"],
            globPatterns: ["index.html", "assets/*.{js,css}", "fonts/*.woff2"],
            navigateFallbackDenylist: [/^\/api\//],
            cleanupOutdatedCaches: true,
            manifestTransforms: [async (entries) => {
              const manifest = JSON.parse(readFileSync(path.join(__dirname, "dist/.vite/manifest.json"), "utf8"));
              const shell = new Set(["index.html", "images/core-logo.svg", "pwa-192x192.png", "pwa-512x512.png"]);
              const visited = new Set();
              function include(key) {
                if (visited.has(key)) return;
                visited.add(key);
                const chunk = manifest[key];
                if (!chunk) return;
                shell.add(chunk.file);
                for (const css of chunk.css || []) shell.add(css);
                for (const dependency of chunk.imports || []) include(dependency);
              }
              for (const [key, chunk] of Object.entries(manifest)) if (chunk.isEntry) include(key);
              return { manifest: entries.filter((entry) => shell.has(entry.url)), warnings: [] };
            }],
            maximumFileSizeToCacheInBytes: 1024 * 1024,
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: "CacheFirst",
                options: {
                  cacheName: "google-fonts-cache",
                  expiration: {
                    maxEntries: 20,
                    maxAgeSeconds: 60 * 60 * 24 * 365,
                  },
                  cacheableResponse: { statuses: [0, 200] },
                },
              },
              {
                urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                handler: "CacheFirst",
                options: {
                  cacheName: "gstatic-fonts-cache",
                  expiration: {
                    maxEntries: 20,
                    maxAgeSeconds: 60 * 60 * 24 * 365,
                  },
                  cacheableResponse: { statuses: [0, 200] },
                },
              },
              {
                urlPattern: /\/api\/.*/i,
                handler: "NetworkOnly",
              },
              {
                urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
                handler: "CacheFirst",
                options: {
                  cacheName: "image-cache",
                  expiration: {
                    maxEntries: 60,
                    maxAgeSeconds: 60 * 60 * 24 * 30,
                  },
                  cacheableResponse: { statuses: [0, 200] },
                },
              },
            ],
          },
          manifest: {
            name: "Core Esports — BMPS Live Leaderboards",
            short_name: "Core Esports",
            description:
              "Live leaderboards, standings & match results for Battlegrounds Mobile India Pro Series",
            theme_color: "#e8600a",
            background_color: "#050505",
            display: "standalone",
            orientation: "portrait-primary",
            start_url: "/",
            scope: "/",
            icons: [
              {
                src: "pwa-192x192.png",
                sizes: "192x192",
                type: "image/png",
              },
              {
                src: "pwa-512x512.png",
                sizes: "512x512",
                type: "image/png",
              },
              {
                src: "pwa-512x512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "any maskable",
              },
            ],
          },
        }),
  ].filter(Boolean),
  server: {
    host: "localhost",
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});

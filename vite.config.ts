import { defineConfig, type Plugin } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import viteTsConfigPaths from "vite-tsconfig-paths";
import tidewave from "tidewave/vite-plugin";
import { readFileSync } from "node:fs";
import { nitro } from "nitro/vite";

import { capsizeRadixPlugin } from "vite-plugin-capsize-radix";
import playfairDisplay from "@capsizecss/metrics/playfairDisplay";
import lato from "@capsizecss/metrics/lato";
import georgia from "@capsizecss/metrics/georgia";
import arial from "@capsizecss/metrics/arial";

// Load .env file for server-side env vars (Electric credentials)
try {
  const envFile = readFileSync(".env", "utf-8");
  for (const line of envFile.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      if (key && valueParts.length > 0) {
        process.env[key] = valueParts.join("=");
      }
    }
  }
} catch {
  // .env file not found
}

/**
 * Vite plugin to proxy Electric SQL shape requests.
 * Handles /api/electric/* routes and forwards to Electric Cloud with credentials.
 */
function electricProxyPlugin(): Plugin {
  return {
    name: "electric-proxy",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/electric/")) {
          return next();
        }

        // Extract table name from URL path
        const urlPath = req.url.split("?")[0];
        const tableName = urlPath.replace("/api/electric/", "").replace(/-/g, "_");

        // Build Electric Cloud URL
        const electricUrl = process.env.ELECTRIC_URL || "https://api.electric-sql.cloud";
        const sourceId = process.env.ELECTRIC_SOURCE_ID;
        const secret = process.env.ELECTRIC_SECRET;

        if (!sourceId || !secret) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: "Electric credentials not configured" }));
          return;
        }

        // Parse query params from original request
        const originalUrl = new URL(req.url, `http://${req.headers.host}`);
        const targetUrl = new URL(`${electricUrl}/v1/shape`);

        // Forward Electric protocol params
        originalUrl.searchParams.forEach((value, key) => {
          targetUrl.searchParams.set(key, value);
        });

        // Add required params
        targetUrl.searchParams.set("table", tableName);
        targetUrl.searchParams.set("source_id", sourceId);
        targetUrl.searchParams.set("secret", secret);

        try {
          const response = await fetch(targetUrl.toString());

          // Forward status and headers
          res.statusCode = response.status;
          response.headers.forEach((value, key) => {
            // Skip problematic headers
            if (!["content-encoding", "content-length", "transfer-encoding"].includes(key.toLowerCase())) {
              res.setHeader(key, value);
            }
          });

          // Stream the response body
          const body = await response.text();
          res.end(body);
        } catch (error) {
          console.error("Electric proxy error:", error);
          res.statusCode = 502;
          res.end(JSON.stringify({ error: "Failed to connect to Electric Cloud" }));
        }
      });
    },
  };
}

const config = defineConfig({
  plugins: [
    electricProxyPlugin(),
    tidewave(),
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    capsizeRadixPlugin({
      outputPath: "./public/typography.css",
      headingFontStack: [playfairDisplay, georgia],
      defaultFontStack: [lato, arial],
    }),
    tanstackStart(),
    nitro({
      scanDirs: ["./server/routes"],
    }),
    viteReact(),
  ],
  server: {
    port: 5173,
  },
});

export default config;

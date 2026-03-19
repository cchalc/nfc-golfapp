import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import viteTsConfigPaths from "vite-tsconfig-paths";
import tidewave from "tidewave/vite-plugin";

import { capsizeRadixPlugin } from "vite-plugin-capsize-radix";
import playfairDisplay from "@capsizecss/metrics/playfairDisplay";
import lato from "@capsizecss/metrics/lato";
import georgia from "@capsizecss/metrics/georgia";
import arial from "@capsizecss/metrics/arial";

const config = defineConfig({
  plugins: [
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
    viteReact(),
  ],
  server: {
    port: 5173,
  },
});

export default config;

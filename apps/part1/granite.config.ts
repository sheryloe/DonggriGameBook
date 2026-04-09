import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "donggrolgamebook-p1",
  brand: {
    displayName: "DonggrolGameBook Part 1",
    primaryColor: "#8B0000",
    icon: "https://static.toss.im/appsintoss/0000/granite.png"
  },
  web: {
    host: "localhost",
    port: 5173,
    commands: {
      dev: "vite --config apps/part1/vite.config.ts",
      build: "vite build --config apps/part1/vite.config.ts"
    }
  },
  permissions: [],
  outdir: "dist/part1",
  webViewProps: {
    type: "game",
    bounces: false,
    pullToRefreshEnabled: false,
    overScrollMode: "never",
    allowsInlineMediaPlayback: true
  }
});

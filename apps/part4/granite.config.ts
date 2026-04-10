import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "donggrolgamebook-p4",
  brand: {
    displayName: "DonggrolGameBook Part 4",
    primaryColor: "#8B0000",
    icon: "https://static.toss.im/appsintoss/0000/granite.png"
  },
  web: {
    host: "localhost",
    port: 5176,
    commands: {
      dev: "vite --config apps/part4/vite.config.ts",
      build: "vite build --config apps/part4/vite.config.ts"
    }
  },
  permissions: [],
  outdir: "dist/part4",
  webViewProps: {
    type: "game",
    bounces: false,
    pullToRefreshEnabled: false,
    overScrollMode: "never",
    allowsInlineMediaPlayback: true
  }
});

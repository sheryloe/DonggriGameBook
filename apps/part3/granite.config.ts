import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "donggrolgamebook-p3",
  brand: {
    displayName: "DonggrolGameBook Part 3",
    primaryColor: "#8B0000",
    icon: "https://static.toss.im/appsintoss/0000/granite.png"
  },
  web: {
    host: "localhost",
    port: 5175,
    commands: {
      dev: "vite --config apps/part3/vite.config.ts",
      build: "vite build --config apps/part3/vite.config.ts"
    }
  },
  permissions: [],
  outdir: "dist/part3",
  webViewProps: {
    type: "game",
    bounces: false,
    pullToRefreshEnabled: false,
    overScrollMode: "never",
    allowsInlineMediaPlayback: true
  }
});

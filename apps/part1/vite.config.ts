import { createGameViteConfig } from "../shared/createGameViteConfig";

export default createGameViteConfig({
  appUrl: import.meta.url,
  partId: "P1",
  appId: "donggrolgamebook-p1",
  outDirName: "part1"
});

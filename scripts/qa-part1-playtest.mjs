import { chromium } from "playwright";
import fs from "node:fs/promises";

const baseUrl = process.argv[2] ?? "http://127.0.0.1:4175/";
const outDir = "output/part1-fix-qa";

await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const issues = { consoleErrors: [], pageErrors: [], badResponses: [], failedRequests: [] };

page.on("console", (msg) => {
  if (msg.type() === "error") issues.consoleErrors.push(msg.text());
});
page.on("pageerror", (err) => issues.pageErrors.push(err.message));
page.on("requestfailed", (req) => issues.failedRequests.push({ url: req.url(), failure: req.failure()?.errorText }));
page.on("response", (res) => {
  if (res.status() >= 400) issues.badResponses.push({ status: res.status(), url: res.url() });
});

await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 60000 });
await page.locator("button.primary-action").first().click();
await page.waitForTimeout(1200);
await page.screenshot({ path: `${outDir}/01-briefing-started.png`, fullPage: true });

await page.evaluate(() => window.__part1EventRunner.triggerEvent("EV_CH01_APPROACH"));
await page.waitForTimeout(1300);
await page.screenshot({ path: `${outDir}/02-event-before-choice.png`, fullPage: true });
const firstChoiceBox = await page.locator(".choice-card").first().boundingBox();

await page.locator(".choice-card").first().click();
await page.waitForTimeout(700);
const afterChoice = await page.evaluate(() => ({
  screen: window.__part1Store.getState().currentScreenId,
  eventId: window.__part1Store.getState().currentEventId,
  scrollY: window.scrollY,
  audio: window.__part1AudioDebug ?? null,
}));

await page.evaluate(async () => {
  await window.__part1EventRunner.enterChapter("CH01");
  window.__part1Store.getState().setScreen("CHAPTER_MAP");
});
await page.waitForTimeout(700);
await page.screenshot({ path: `${outDir}/03-map-mobile.png`, fullPage: true });
const mapBoxes = await page.locator(".map-node").evaluateAll((nodes) =>
  nodes.map((node) => {
    const r = node.getBoundingClientRect();
    return { text: node.textContent?.trim(), left: r.left, right: r.right, top: r.top, bottom: r.bottom };
  })
);

await page.evaluate(() => window.__part1EventRunner.triggerEvent("EV_CH01_BOSS_BROADCAST"));
await page.waitForTimeout(700);
await page.screenshot({ path: `${outDir}/04-battle-mobile.png`, fullPage: true });
const battleState = await page.evaluate(() => ({
  screen: window.__part1Store.getState().currentScreenId,
  scrollY: window.scrollY,
}));

await page.evaluate(() => window.__part1EventRunner.completeChapter());
await page.waitForTimeout(1900);
await page.screenshot({ path: `${outDir}/05-result-mobile.png`, fullPage: true });

const finalDebug = await page.evaluate(() => ({
  audio: window.__part1AudioDebug ?? null,
  narration: window.__part1NarrationDebug ?? null,
  voiceLine: window.__part1VoiceLineDebug ?? null,
  current: {
    currentChapterId: window.__part1Store.getState().currentChapterId,
    currentEventId: window.__part1Store.getState().currentEventId,
    currentScreenId: window.__part1Store.getState().currentScreenId,
  },
  resources: performance
    .getEntriesByType("resource")
    .map((entry) => entry.name)
    .filter((name) => /generated\/(audio|images)|\.mp4|video/i.test(name)),
}));

const summary = {
  issues,
  firstChoiceBox,
  afterChoice,
  battleState,
  mapOutOfBounds: mapBoxes.filter((box) => box.left < 0 || box.right > 390),
  finalDebug,
};

await fs.writeFile(`${outDir}/result.json`, JSON.stringify(summary, null, 2), "utf8");

console.log(JSON.stringify({
  consoleErrors: issues.consoleErrors.length,
  pageErrors: issues.pageErrors.length,
  badResponses: issues.badResponses.length,
  failedRequests: issues.failedRequests.length,
  firstChoiceBottom: Math.round((firstChoiceBox?.y ?? 0) + (firstChoiceBox?.height ?? 0)),
  choiceSelects: finalDebug.audio?.choiceSelects ?? 0,
  ttsRequests: finalDebug.resources.filter((x) => x.includes("/generated/audio/tts/")).length,
  imageRequests: finalDebug.resources.filter((x) => x.includes("/generated/images/")).length,
  videoRequests: finalDebug.resources.filter((x) => /\.mp4|video/i.test(x)).length,
  mapOutOfBounds: summary.mapOutOfBounds.length,
  afterChoice,
  battleState,
  current: finalDebug.current,
}, null, 2));

await browser.close();

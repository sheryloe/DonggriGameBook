import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const baseUrl = process.argv[2] ?? "http://127.0.0.1:5171/";
const outDir = path.join("output", "part1-representative-qa");

const cases = [
  { chapterId: "CH01", eventId: "__BRIEFING__", label: "ch01-briefing" },
  { chapterId: "CH01", eventId: "EV_CH01_BOSS_BROADCAST", label: "ch01-boss" },
  { chapterId: "CH02", eventId: "EV_CH02_BLACKMARKET", label: "ch02-blackmarket" },
  { chapterId: "CH02", eventId: "EV_CH02_SLUICE_BOSS", label: "ch02-boss" },
  { chapterId: "CH03", eventId: "EV_CH03_SKYBRIDGE", label: "ch03-skybridge" },
  { chapterId: "CH03", eventId: "EV_CH03_BOSS_GARDEN", label: "ch03-boss" },
  { chapterId: "CH04", eventId: "EV_CH04_BOSS_PICKER", label: "ch04-boss" },
  { chapterId: "CH05", eventId: "EV_CH05_BOSS_LINES", label: "ch05-boss" },
  { chapterId: "CH05", eventId: "EV_CH05_EXTRACTION", label: "ch05-extraction" },
];

const badCodePoints = new Set([0xfffd, 0x5360, 0x63f6, 0x7b4c, 0x7344, 0x8881, 0x81fe, 0x905a, 0x6e72, 0x8adb, 0x5a9b, 0xf9de, 0xf9fe, 0x0080, 0x33cc]);
function hasBrokenText(text) {
  return /\?\?\?/u.test(text) || [...text].some((ch) => badCodePoints.has(ch.charCodeAt(0)));
}

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

await page.addInitScript(() => {
  localStorage.removeItem("donggri-part1-survival-save-v1");
});
await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForFunction(() => Boolean(window.__part1Store && window.__part1EventRunner), null, { timeout: 60000 });
await page.waitForTimeout(600);

const snapshots = [];

for (const testCase of cases) {
  const jumpResult = await page.evaluate(async ({ chapterId, eventId }) => {
    await window.__part1EventRunner.enterChapter(chapterId);
    if (eventId === "__BRIEFING__") {
      window.__part1Store.getState().setScreen("BRIEFING");
      return { ok: true, screen: "BRIEFING" };
    }
    window.__part1EventRunner.triggerEvent(eventId);
    return { ok: true, screen: window.__part1Store.getState().currentScreenId };
  }, testCase).catch((error) => ({ ok: false, error: String(error) }));

  await page.waitForTimeout(1100);
  await page.screenshot({ path: path.join(outDir, `${testCase.label}.png`), fullPage: true });

  const result = await page.evaluate(() => {
    const state = window.__part1Store.getState();
    const choiceButtons = Array.from(document.querySelectorAll(".choice-card")).map((button) => ({
      text: button.textContent?.replace(/\s+/g, " ").trim(),
      disabled: button.hasAttribute("disabled"),
    }));
    const heading = document.querySelector("h1")?.textContent?.trim() ?? "";
    const bodyText = document.querySelector("main")?.textContent?.replace(/\s+/g, " ").trim() ?? "";
    return {
      screen: state.currentScreenId,
      chapterId: state.currentChapterId,
      eventId: state.currentEventId,
      heading,
      choiceCount: choiceButtons.length,
      choices: choiceButtons,
      bodyText,
    };
  });

  snapshots.push({
    ...testCase,
    jumpResult,
    ...result,
    hasBrokenText: hasBrokenText(`${result.heading} ${result.bodyText}`),
  });
}

await page.evaluate(async () => {
  await window.__part1EventRunner.enterChapter("CH05");
  window.__part1EventRunner.completeChapter();
});
await page.waitForTimeout(1400);
await page.screenshot({ path: path.join(outDir, "ch05-result.png"), fullPage: true });

const resultScreen = await page.evaluate(() => ({
  screen: window.__part1Store.getState().currentScreenId,
  text: document.querySelector("main")?.textContent?.replace(/\s+/g, " ").trim() ?? "",
}));

const summary = {
  issues,
  snapshots,
  resultScreen: {
    screen: resultScreen.screen,
    hasTitle: resultScreen.text.includes("기록") || resultScreen.text.includes("완료") || resultScreen.screen === "RESULT",
    hasBrokenText: hasBrokenText(resultScreen.text),
  },
};

await fs.writeFile(path.join(outDir, "result.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");

console.log(JSON.stringify({
  consoleErrors: issues.consoleErrors.length,
  pageErrors: issues.pageErrors.length,
  badResponses: issues.badResponses.length,
  failedRequests: issues.failedRequests.length,
  cases: snapshots.length,
  brokenTextCases: snapshots.filter((item) => item.hasBrokenText).map((item) => item.label),
  missingChoiceCases: snapshots.filter((item) => item.screen === "EVENT" && item.choiceCount === 0).map((item) => item.label),
  resultScreen: summary.resultScreen,
  output: outDir,
}, null, 2));

await browser.close();
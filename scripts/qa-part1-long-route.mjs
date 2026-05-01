import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const baseUrl = process.argv[2] ?? "http://127.0.0.1:5171/";
const rootOutDir = path.join("output", "part1-long-route");

const routes = [
  {
    id: "safe",
    choice: "first",
    battle: "highest",
    rests: ["short", "medical"],
    forceDeadlineAfter: null,
  },
  {
    id: "balanced",
    choice: "middle",
    battle: "middle",
    rests: ["short"],
    forceDeadlineAfter: null,
  },
  {
    id: "risky",
    choice: "last",
    battle: "lowest",
    rests: ["overnight"],
    forceDeadlineAfter: "CH02",
  },
];

const chapters = [
  { chapterId: "CH01", events: ["EV_CH01_APPROACH", "EV_CH01_BOSS_BROADCAST"] },
  { chapterId: "CH02", events: ["EV_CH02_BLACKMARKET", "EV_CH02_SLUICE_BOSS"] },
  { chapterId: "CH03", events: ["EV_CH03_SKYBRIDGE", "EV_CH03_BOSS_GARDEN"] },
  { chapterId: "CH04", events: ["EV_CH04_BOSS_PICKER"] },
  { chapterId: "CH05", events: ["EV_CH05_BOSS_LINES", "EV_CH05_EXTRACTION"] },
];

const issueSummary = () => ({ consoleErrors: [], pageErrors: [], badResponses: [], failedRequests: [] });

async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function bootPage(browser, routeId, issues) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
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
  await page.waitForTimeout(500);
  return page;
}

async function screenState(page) {
  return page.evaluate(() => {
    const state = window.__part1Store.getState();
    return {
      screen: state.currentScreenId,
      chapterId: state.currentChapterId,
      eventId: state.currentEventId,
      nodeId: state.currentNodeId,
      stats: state.stats,
      elapsedHours: state.elapsedHours,
      day: state.day,
      timeBlock: state.timeBlock,
      failedQuestIds: state.failedQuestIds,
      pendingDeadlineEvent: state.pendingDeadlineEvent,
      battle: state.battleState,
      survivalLog: state.survivalLog,
    };
  });
}

async function screenshot(page, outDir, name) {
  await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: true }).catch(() => undefined);
}

async function handleDeadline(page, outDir, routeResult, label) {
  let guard = 0;
  while (guard < 4) {
    const state = await screenState(page);
    if (state.screen !== "DEADLINE_CONSEQUENCE") return;
    routeResult.deadlineConsequences.push({ label, event: state.pendingDeadlineEvent });
    await screenshot(page, outDir, `${label}-deadline-${guard}`);
    const button = page.locator("button.primary-action").first();
    if (await button.count()) {
      await button.click();
    } else {
      await page.evaluate(() => window.__part1Store.getState().clearDeadlineEvent());
    }
    await page.waitForTimeout(500);
    guard++;
  }
}

async function clickChoice(page, mode, routeResult) {
  const buttons = page.locator(".choice-card:not([disabled])");
  const count = await buttons.count();
  if (count === 0) return false;
  let index = 0;
  if (mode === "last") index = count - 1;
  if (mode === "middle") index = Math.floor((count - 1) / 2);
  const text = await buttons.nth(index).textContent().catch(() => "");
  routeResult.choiceClicks.push({ index, count, text: text?.replace(/\s+/g, " ").trim() });
  await buttons.nth(index).click();
  await page.waitForTimeout(650);
  return true;
}

async function handleBattle(page, outDir, route, routeResult, label) {
  let guard = 0;
  while (guard < 12) {
    const state = await screenState(page);
    if (state.screen !== "BATTLE") return;
    const debug = await page.evaluate(() => window.__part1EncounterDebug ?? null);
    if (debug?.offeredPatterns?.length) {
      routeResult.encounters.push({ label, attempt: guard, offeredPatterns: debug.offeredPatterns });
    }
    await screenshot(page, outDir, `${label}-battle-${guard}`);
    await page.waitForSelector(".encounter-buttons button:not([disabled])", { timeout: 2500 }).catch(() => undefined);
    const stateAfterWait = await screenState(page);
    if (stateAfterWait.screen !== "BATTLE") return;
    const buttons = page.locator(".encounter-buttons button:not([disabled])");
    const count = await buttons.count();
    if (count === 0) {
      routeResult.softLocks.push({ label, reason: "battle has no enabled encounter options after wait" });
      return;
    }
    let index = 0;
    if (route.battle === "lowest" && debug?.offeredPatterns?.length) {
      index = Math.max(0, debug.offeredPatterns.reduce((lowest, item, i, arr) => item.chance < arr[lowest].chance ? i : lowest, 0));
    } else if (route.battle === "highest" && debug?.offeredPatterns?.length) {
      index = Math.max(0, debug.offeredPatterns.reduce((highest, item, i, arr) => item.chance > arr[highest].chance ? i : highest, 0));
    } else {
      index = Math.min(count - 1, Math.floor(count / 2));
    }
    await buttons.nth(Math.min(index, count - 1)).click();
    await page.waitForTimeout(900);
    await handleDeadline(page, outDir, routeResult, `${label}-battle`);
    guard++;
  }
  const finalState = await screenState(page);
  if (finalState.screen === "BATTLE") {
    routeResult.softLocks.push({ label, reason: "battle did not resolve within 12 actions" });
  }
}

async function runRest(page, outDir, routeResult, kind, label) {
  await page.evaluate((restKind) => {
    const state = window.__part1Store.getState();
    state.setScreen("SAFEHOUSE");
    state.restAtSafehouse(restKind);
    if (window.__part1Store.getState().pendingDeadlineEvent) {
      window.__part1Store.getState().setDeadlineReturn("SAFEHOUSE", null);
      window.__part1Store.getState().setScreen("DEADLINE_CONSEQUENCE");
    }
  }, kind);
  routeResult.recoveryOptions += 1;
  await page.waitForTimeout(450);
  await screenshot(page, outDir, `${label}-rest-${kind}`);
  await handleDeadline(page, outDir, routeResult, `${label}-rest-${kind}`);
}

async function triggerEvent(page, outDir, route, routeResult, chapterId, eventId, label) {
  await page.evaluate(async ({ chapterId, eventId }) => {
    await window.__part1EventRunner.enterChapter(chapterId);
    window.__part1EventRunner.triggerEvent(eventId);
  }, { chapterId, eventId }).catch((error) => {
    routeResult.softLocks.push({ label, reason: `trigger failed: ${String(error)}` });
  });
  await page.waitForTimeout(850);
  await screenshot(page, outDir, `${label}-start`);
  await handleDeadline(page, outDir, routeResult, `${label}-start`);

  let state = await screenState(page);
  if (state.screen === "BATTLE") {
    await handleBattle(page, outDir, route, routeResult, label);
    return;
  }
  if (state.screen === "EVENT") {
    const clicked = await clickChoice(page, route.choice, routeResult);
    if (!clicked) routeResult.nonInteractiveEvents.push({ label, reason: "event has no enabled choices" });
    await handleDeadline(page, outDir, routeResult, `${label}-choice`);
    state = await screenState(page);
    if (state.screen === "BATTLE") await handleBattle(page, outDir, route, routeResult, `${label}-after-choice`);
  }
}

async function forceDeadlineIfNeeded(page, outDir, route, routeResult, chapterId) {
  if (route.forceDeadlineAfter !== chapterId) return;
  await page.evaluate(() => {
    const state = window.__part1Store.getState();
    state.advanceTime(70, "롱런 QA 강제 시간 경과");
    if (window.__part1Store.getState().pendingDeadlineEvent) {
      window.__part1Store.getState().setDeadlineReturn("CHAPTER_MAP", null);
      window.__part1Store.getState().setScreen("DEADLINE_CONSEQUENCE");
    }
  });
  await page.waitForTimeout(500);
  await screenshot(page, outDir, `${chapterId}-forced-deadline`);
  await handleDeadline(page, outDir, routeResult, `${chapterId}-forced`);
}

async function runRoute(browser, route) {
  const outDir = path.join(rootOutDir, route.id);
  await fs.mkdir(outDir, { recursive: true });
  const issues = issueSummary();
  const routeResult = {
    route: route.id,
    startedAt: new Date().toISOString(),
    issues,
    chaptersVisited: [],
    choiceClicks: [],
    encounters: [],
    deadlineConsequences: [],
    recoveryOptions: 0,
    softLocks: [],
    nonInteractiveEvents: [],
    finalState: null,
    reachedCh05Ending: false,
  };

  const page = await bootPage(browser, route.id, issues);

  for (const [index, chapter] of chapters.entries()) {
    routeResult.chaptersVisited.push(chapter.chapterId);
    for (const eventId of chapter.events) {
      await triggerEvent(page, outDir, route, routeResult, chapter.chapterId, eventId, `${chapter.chapterId}-${eventId}`);
    }
    if (route.rests[index] || (route.id === "safe" && index === 2)) {
      await runRest(page, outDir, routeResult, route.rests[index] ?? "short", chapter.chapterId);
    }
    await forceDeadlineIfNeeded(page, outDir, route, routeResult, chapter.chapterId);
  }

  await page.evaluate(async () => {
    await window.__part1EventRunner.enterChapter("CH05");
    window.__part1EventRunner.completeChapter();
  });
  await page.waitForTimeout(900);
  await handleDeadline(page, outDir, routeResult, "final");
  await screenshot(page, outDir, "final");

  routeResult.finalState = await screenState(page);
  routeResult.reachedCh05Ending = routeResult.finalState.screen === "RESULT" && routeResult.finalState.chapterId === "CH05";
  routeResult.finishedAt = new Date().toISOString();
  await writeJson(path.join(outDir, "result.json"), routeResult);
  await page.close();
  return routeResult;
}

await fs.mkdir(rootOutDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];
for (const route of routes) {
  results.push(await runRoute(browser, route));
}
await browser.close();

const summary = {
  baseUrl,
  output: rootOutDir,
  routes: results.map((result) => ({
    route: result.route,
    reachedCh05Ending: result.reachedCh05Ending,
    softLocks: result.softLocks.length,
    deadlineConsequences: result.deadlineConsequences.length,
    recoveryOptions: result.recoveryOptions,
    consoleErrors: result.issues.consoleErrors.length,
    pageErrors: result.issues.pageErrors.length,
    badResponses: result.issues.badResponses.length,
    failedRequests: result.issues.failedRequests.length,
    finalScreen: result.finalState?.screen,
    finalChapter: result.finalState?.chapterId,
  })),
};
summary.pass = summary.routes.some((route) => route.reachedCh05Ending)
  && summary.routes.every((route) => route.softLocks === 0)
  && summary.routes.every((route) => route.consoleErrors === 0 && route.pageErrors === 0 && route.failedRequests === 0)
  && summary.routes.some((route) => route.recoveryOptions >= 2)
  && summary.routes.some((route) => route.deadlineConsequences >= 1);

await writeJson(path.join(rootOutDir, "summary.json"), summary);
console.log(JSON.stringify(summary, null, 2));
if (!summary.pass) {
  process.exitCode = 1;
}
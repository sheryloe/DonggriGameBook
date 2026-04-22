import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const UI_DIR = path.join(ROOT, "private", "content", "ui");
const CHAPTER_DIR = path.join(ROOT, "private", "content", "data", "chapters");

const SCREEN_LABELS = {
  chapter_briefing: "브리핑",
  world_map: "월드 맵",
  event_dialogue: "이벤트",
  loot_resolution: "루팅 정산",
  boss_intro: "보스 조우",
  combat_arena: "전투",
  result_summary: "결과 요약",
  route_select: "노선 선택",
  safehouse: "은신처",
  ending_gallery: "엔딩 기록"
};

const SCREEN_PURPOSE = {
  chapter_briefing: (title) => `${title}의 목표와 현장 상황을 정리하는 브리핑 화면입니다.`,
  world_map: (title) => `${title} 진행 경로와 노드를 확인하는 월드 맵 화면입니다.`,
  event_dialogue: (title) => `${title}의 핵심 선택과 대화를 진행하는 화면입니다.`,
  loot_resolution: (title) => `${title}에서 확보한 물자를 정산하는 루팅 화면입니다.`,
  boss_intro: (title) => `${title} 보스 조우 직전 긴장을 전달하는 화면입니다.`,
  combat_arena: (title) => `${title} 전투를 수행하는 화면입니다.`,
  result_summary: (title) => `${title} 결과와 후속 영향을 정리하는 화면입니다.`,
  route_select: (title) => `${title}의 진입 노선을 확정하는 화면입니다.`,
  safehouse: (title) => `${title} 은신처 허브에서 다음 행동을 준비하는 화면입니다.`,
  ending_gallery: (title) => `${title}에서 해금한 엔딩 기록을 확인하는 화면입니다.`
};

function isBrokenText(value) {
  if (typeof value !== "string") return false;
  if (/\?{2,}/u.test(value)) return true;
  if (/[�]/u.test(value)) return true;
  const hasHan = /[\p{Script=Han}]/u.test(value);
  const hasHangul = /[\p{Script=Hangul}]/u.test(value);
  return hasHan && hasHangul;
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw.replace(/^\uFEFF/u, ""));
}

async function writeJson(filePath, data) {
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function loadChapterTitle(chapterId) {
  const chapterPath = path.join(CHAPTER_DIR, `${chapterId.toLowerCase()}.json`);
  try {
    const chapter = await readJson(chapterPath);
    return typeof chapter.title === "string" && chapter.title.trim() ? chapter.title.trim() : chapterId;
  } catch {
    return chapterId;
  }
}

async function normalizeUiFlow(uiPath) {
  const ui = await readJson(uiPath);
  const chapterId = String(ui.chapter_id ?? path.basename(uiPath, ".ui_flow.json").toUpperCase());
  const chapterTitle = await loadChapterTitle(chapterId);

  ui.title = `${chapterTitle} UI 플로우`;

  if (Array.isArray(ui.screens)) {
    for (const screen of ui.screens) {
      const screenType = String(screen.screen_type ?? "");
      const label = SCREEN_LABELS[screenType] ?? "화면";
      screen.title = `${chapterTitle} ${label}`;
      screen.purpose = (SCREEN_PURPOSE[screenType] ?? ((title) => `${title} 진행을 위한 화면입니다.`))(chapterTitle);

      if (Array.isArray(screen.notes)) {
        screen.notes = screen.notes.map((note) =>
          isBrokenText(note) ? "운영 노트는 대시보드 및 기획 문서 기준으로 관리합니다." : note
        );
      }
    }
  }

  if (Array.isArray(ui.transitions)) {
    for (const transition of ui.transitions) {
      if (isBrokenText(transition.notes)) {
        transition.notes = "";
      }
    }
  }

  if (Array.isArray(ui.notes)) {
    ui.notes = ui.notes.map((note) => (isBrokenText(note) ? "운영 메타 정보는 별도 문서에서 관리합니다." : note));
  }

  await writeJson(uiPath, ui);
}

async function main() {
  const entries = await fs.readdir(UI_DIR);
  const files = entries.filter((name) => name.endsWith(".ui_flow.json")).sort();
  for (const file of files) {
    await normalizeUiFlow(path.join(UI_DIR, file));
  }
  console.log(`normalized ${files.length} ui_flow files`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

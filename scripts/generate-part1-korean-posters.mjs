import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const imageRoot = path.join(root, "public", "generated", "images");

const posters = [
  {
    file: "poster_ch01_yeouido_ash",
    title: "여의도 송출",
    subtitle: "CH01 / 여의도 방송동",
    body: "끊긴 구조 신호가 다시 켜진다.",
    stamp: "기록 복구 중",
  },
  {
    file: "poster_ch02_flooded_market",
    title: "검은 수로",
    subtitle: "CH02 / 노량진 수몰시장",
    body: "발밑의 물살이 먼저 사람을 고른다.",
    stamp: "배수문 접근",
  },
  {
    file: "poster_ch03_jamsil_vertical",
    title: "유리정원",
    subtitle: "CH03 / 잠실 수직정원",
    body: "높이 올라갈수록 이름이 아래에 남는다.",
    stamp: "전력·증언 회수",
  },
  {
    file: "poster_ch04_munjeong_logistics",
    title: "상자들의 전시",
    subtitle: "CH04 / 문정 자동분류 구역",
    body: "버려진 물자는 버려진 사람과 같은 줄에 놓인다.",
    stamp: "의료 상자 회수",
  },
  {
    file: "poster_ch05_pangyo_server",
    title: "미러필터",
    subtitle: "CH05 / 판교 재난 백업 서버",
    body: "기록은 살아남고 사람은 선택된다.",
    stamp: "Part 1 결산",
  },
];

function asDataUrl(bytes) {
  return `data:image/webp;base64,${Buffer.from(bytes).toString("base64")}`;
}

async function firstExisting(paths) {
  for (const filePath of paths) {
    try {
      await fs.access(filePath);
      return filePath;
    } catch {
      // Continue.
    }
  }
  throw new Error(`Missing poster source: ${paths.join(", ")}`);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1200, height: 1500 },
  deviceScaleFactor: 1,
});

for (const poster of posters) {
  const src = await firstExisting([
    path.join(imageRoot, `${poster.file}_v01.webp`),
    path.join(imageRoot, `${poster.file}.webp`),
  ]);
  const bytes = await fs.readFile(src);
  const dataUrl = asDataUrl(bytes);

  const webpBase64 = await page.evaluate(async ({ dataUrl, poster }) => {
    await document.fonts.ready;
    const img = new Image();
    img.src = dataUrl;
    await img.decode();

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context unavailable");

    const w = canvas.width;
    const h = canvas.height;
    ctx.drawImage(img, 0, 0, w, h);

    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, "rgba(2, 5, 6, 0.18)");
    gradient.addColorStop(0.38, "rgba(2, 5, 6, 0.38)");
    gradient.addColorStop(0.78, "rgba(2, 5, 6, 0.72)");
    gradient.addColorStop(1, "rgba(2, 5, 6, 0.88)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    const panelX = Math.round(w * 0.075);
    const panelY = Math.round(h * 0.58);
    const panelW = Math.round(w * 0.85);
    const panelH = Math.round(h * 0.31);
    ctx.fillStyle = "rgba(2, 5, 6, 0.78)";
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = "rgba(226, 198, 112, 0.62)";
    ctx.lineWidth = Math.max(2, Math.round(w * 0.0038));
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0, 0, 0, 0.86)";
    ctx.shadowBlur = Math.round(w * 0.016);

    ctx.font = `800 ${Math.round(w * 0.043)}px "Malgun Gothic", "Noto Sans KR", sans-serif`;
    ctx.fillStyle = "#9ccfd6";
    ctx.fillText(poster.subtitle, w / 2, Math.round(h * 0.14));

    ctx.font = `900 ${Math.round(w * 0.125)}px "Malgun Gothic", "Noto Sans KR", sans-serif`;
    ctx.fillStyle = "#f4f1ea";
    ctx.fillText(poster.title, w / 2, Math.round(h * 0.685));

    ctx.shadowBlur = Math.round(w * 0.008);
    ctx.font = `700 ${Math.round(w * 0.039)}px "Malgun Gothic", "Noto Sans KR", sans-serif`;
    ctx.fillStyle = "#e8c66b";
    ctx.fillText(poster.body, w / 2, Math.round(h * 0.79));

    const stampW = Math.round(w * 0.42);
    const stampH = Math.round(h * 0.052);
    const stampX = Math.round((w - stampW) / 2);
    const stampY = Math.round(h * 0.845);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(156, 207, 214, 0.92)";
    ctx.fillRect(stampX, stampY, stampW, stampH);
    ctx.font = `900 ${Math.round(w * 0.03)}px "Malgun Gothic", "Noto Sans KR", sans-serif`;
    ctx.fillStyle = "#050708";
    ctx.fillText(poster.stamp, w / 2, stampY + stampH / 2);

    return canvas.toDataURL("image/webp", 0.92).replace(/^data:image\/webp;base64,/, "");
  }, { dataUrl, poster });

  const output = Buffer.from(webpBase64, "base64");
  await fs.writeFile(path.join(imageRoot, `${poster.file}.webp`), output);
  await fs.writeFile(path.join(imageRoot, `${poster.file}_v01.webp`), output);
  console.log(`updated ${poster.file}.webp`);
}

await browser.close();

import fs from "fs";

const chapters = ["ch01", "ch02", "ch03", "ch04", "ch05"];

function estimate(ch) {
  let narrativeChars = 0;
  let choiceChars = 0;
  let choiceCount = 0;
  let combatCount = 0;
  let bossCount = 0;

  for (const ev of ch.events) {
    if (ev.text?.summary) narrativeChars += ev.text.summary.length;
    if (Array.isArray(ev.text?.body)) {
      for (const line of ev.text.body) narrativeChars += line.length;
    }
    if (Array.isArray(ev.choices)) {
      for (const c of ev.choices) {
        choiceCount += 1;
        if (c.label) choiceChars += c.label.length;
        if (c.preview) choiceChars += c.preview.length;
      }
    }
    if (ev.combat) {
      combatCount += 1;
    }
    if (ev.event_type === "boss") {
      bossCount += 1;
    }
  }

  const readMin = (narrativeChars + choiceChars) / 700;
  const choiceMin = (choiceCount * 6) / 60;
  const mapMin = Math.max(ch.nodes.length - 1, 0) * 0.35;
  const combatMin = Math.max(combatCount - bossCount, 0) * 3.0 + bossCount * 4.5;
  const total = readMin + choiceMin + mapMin + combatMin + 0.5;

  return {
    events: ch.events.length,
    nodes: ch.nodes.length,
    objectives: ch.objectives.length,
    choices: choiceCount,
    combat: combatCount,
    narrativeChars,
    choiceChars,
    estimateMin: Number(total.toFixed(1))
  };
}

for (const id of chapters) {
  const file = `codex_webgame_pack/data/chapters/${id}.json`;
  const ch = JSON.parse(fs.readFileSync(file, "utf8"));
  const result = estimate(ch);
  console.log(id.toUpperCase(), result);
}

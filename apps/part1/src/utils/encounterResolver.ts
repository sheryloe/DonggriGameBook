import { ENCOUNTER_PATTERNS, EncounterPattern, LoadoutBonus } from "./encounterPatterns";

export function chapterEncounterHint(chapterId: string | null): string {
  switch (chapterId) {
    case "CH01": return "젖은 방송 장비가 콘솔 뒤로 늘어지고, 낡은 스피커가 짧게 기침한다.";
    case "CH02": return "발목까지 찬 물이 통로를 바꾸고 있다. 멀리서 철문이 한 번, 천천히 흔들린다.";
    case "CH03": return "깨진 유리 사이로 바람이 들어온다. 반사된 그림자가 먼저 움직인다.";
    case "CH04": return "멈춘 컨베이어가 짧게 울린다. 묶인 상자들이 사람처럼 줄을 선다.";
    case "CH05": return "서버 랙 사이가 짧게 열린다. 끊긴 신호가 바닥을 타고 다시 사라진다.";
    default: return "소리가 먼저 오고, 정체는 그 뒤에 따라온다.";
  }
}

export function clampChance(value: number): number {
  return Math.max(0.06, Math.min(0.94, value));
}

export function chancePercent(value: number): number {
  return Math.round(clampChance(value) * 100);
}

export function randomInt([min, max]: [number, number]): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function survivalLoadoutBonus(inventory: Array<{ item_id: string; quantity: number }>): LoadoutBonus {
  let weapon = 0;
  let armor = 0;
  let utility = 0;
  let medical = 0;
  const labels = new Set<string>();

  for (const item of inventory) {
    const key = item.item_id.toLowerCase();
    const qty = Math.max(1, Number(item.quantity ?? 1));
    if (/weapon|knife|pistol|baton|crowbar|pipe|spear|flare|stun|blade|machete/u.test(key)) {
      weapon += 0.035 * qty;
      labels.add("제압 도구");
    }
    if (/mask|vest|glove|boot|shield|pad|apron|respirator|wader|outer_shell|face_shield|armor/u.test(key)) {
      armor += 4 * qty;
      labels.add("보호 장비");
    }
    if (/smoke|lure|chalk|lamp|line|reel|purifier|clicker|blanket|marker|flare/u.test(key)) {
      utility += 0.035 * qty;
      labels.add("보조 도구");
    }
    if (/bandage|disinfectant|saline|medical|patch|ampoule|gel|wipe|tabs/u.test(key)) {
      medical += 0.04 * qty;
      labels.add("응급 처치");
    }
  }

  return {
    weaponChance: Math.min(0.22, weapon),
    armorReduction: Math.min(22, armor),
    utilityChance: Math.min(0.2, utility),
    medicalChance: Math.min(0.22, medical),
    labels: [...labels],
  };
}

function patternChapterWeight(pattern: EncounterPattern, chapterId: string | null, frameTone: string): number {
  let weight = pattern.weight;
  if (chapterId === "CH01" && (pattern.id === "freeze_under_static" || pattern.id === "drip_timing")) weight += 6;
  if (chapterId === "CH02" && pattern.tags.includes("water")) weight += 8;
  if (chapterId === "CH03" && (pattern.tags.includes("light") || pattern.id === "service_duct")) weight += 5;
  if (chapterId === "CH04" && (pattern.tags.includes("barrier") || pattern.id === "shelf_block")) weight += 6;
  if (chapterId === "CH05" && (pattern.id === "freeze_under_static" || pattern.tags.includes("light"))) weight += 5;
  if (frameTone === "encounter" && pattern.tags.includes("observe")) weight += 2;
  return Math.max(1, weight);
}

function weightedPick<T>(items: T[], weightOf: (item: T) => number): T {
  const total = items.reduce((sum, item) => sum + weightOf(item), 0);
  let cursor = Math.random() * total;
  for (const item of items) {
    cursor -= weightOf(item);
    if (cursor <= 0) return item;
  }
  return items[items.length - 1];
}

function isIndoorContext(contextKey: string, chapterId: string | null): boolean {
  return chapterId === "CH03" || chapterId === "CH04" || chapterId === "CH05" || /hall|room|door|gate|concourse|building|server|logistics|office|station|floor|basement|interior|broadcast/u.test(contextKey);
}

function isPatternEligible(pattern: EncounterPattern, input: { chapterId: string | null; contextKey: string; injury: number; infection: number; loadout: LoadoutBonus }): boolean {
  if (pattern.id === "wrap_wound" && input.injury < 8 && input.infection < 8 && input.loadout.medicalChance <= 0) return false;
  if ((pattern.id === "quiet_door" || pattern.id === "service_duct" || pattern.id === "shelf_block" || pattern.id === "call_and_lock") && !isIndoorContext(input.contextKey, input.chapterId)) return false;
  if (pattern.id === "water_cover_noise" && input.chapterId !== "CH02" && !/water|flood|drain|sluice|canal|river|market|wet/u.test(input.contextKey)) return false;
  if (pattern.id === "drip_timing" && input.chapterId !== "CH01" && input.chapterId !== "CH02" && !/water|flood|wet|basement/u.test(input.contextKey)) return false;
  if (pattern.id === "armor_push" && input.loadout.armorReduction <= 0) return false;
  return true;
}

export function pickEncounterPatterns(chapterId: string | null, frameTone: string, isObserved: boolean, loadout: LoadoutBonus, contextKey: string, injury: number, infection: number): EncounterPattern[] {
  const selected: EncounterPattern[] = [];
  let pool = ENCOUNTER_PATTERNS
    .filter((pattern) => isObserved || !pattern.observedAfterUse)
    .filter((pattern) => isPatternEligible(pattern, { chapterId, contextKey, injury, infection, loadout }));

  if (pool.length < 4) {
    pool = ENCOUNTER_PATTERNS.filter((pattern) => isObserved || !pattern.observedAfterUse);
  }

  while (selected.length < 4 && pool.length > 0) {
    const picked = weightedPick(pool, (pattern) => {
      let weight = patternChapterWeight(pattern, chapterId, frameTone);
      if (pattern.tags.includes("weapon")) weight += loadout.weaponChance > 0 ? 8 : -2;
      if (pattern.tags.includes("armor")) weight += loadout.armorReduction > 0 ? 8 : -2;
      if (pattern.tags.includes("utility")) weight += loadout.utilityChance > 0 ? 8 : 0;
      if (pattern.tags.includes("medical")) weight += loadout.medicalChance > 0 ? 8 : -1;
      return Math.max(1, weight);
    });
    selected.push(picked);
    pool = pool.filter((pattern) => pattern.id !== picked.id);
  }

  return selected;
}

export function resolvePatternChance(pattern: EncounterPattern, input: { observedBonus: number; noise: number; pressurePercent: number; loadout: LoadoutBonus; chapterId: string | null }): number {
  let chance = pattern.baseChance + input.observedBonus - Math.min(0.16, input.noise / 600) - input.pressurePercent / 650;
  if (pattern.tags.includes("stealth")) chance += input.loadout.utilityChance * 0.6;
  if (pattern.tags.includes("utility")) chance += input.loadout.utilityChance;
  if (pattern.tags.includes("weapon")) chance += input.loadout.weaponChance;
  if (pattern.tags.includes("armor")) chance += input.loadout.armorReduction / 260;
  if (pattern.tags.includes("medical")) chance += input.loadout.medicalChance;
  if (pattern.tags.includes("water") && input.chapterId === "CH02") chance += 0.08;
  if (pattern.tags.includes("light") && (input.chapterId === "CH03" || input.chapterId === "CH05")) chance += 0.06;
  if (pattern.tags.includes("barrier") && input.chapterId === "CH04") chance += 0.06;
  return clampChance(chance);
}

export function fatalOutcomeChance(input: { nextInjury: number; nextInfection: number; severity: number; isHumanThreat: boolean }): number {
  if (input.nextInjury >= 100 || input.nextInfection >= 100) return 1;
  const base = input.isHumanThreat
    ? Math.max(0, (input.nextInjury - 68) / 95) + input.severity / 140
    : Math.max(0, (input.nextInfection - 54) / 90) + Math.max(0, (input.nextInjury - 86) / 130) + input.severity / 160;
  return Math.max(0, Math.min(0.88, base));
}
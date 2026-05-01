export function chapterLabel(chapterId: string | null | undefined): string {
  const match = /^CH(\d+)$/u.exec(String(chapterId ?? ""));
  if (!match) {
    return chapterId ?? "장 정보 없음";
  }
  return `제${Number(match[1])}장`;
}

export function categoryLabel(category: string | null | undefined): string {
  switch (category) {
    case "weapon":
      return "전투 장비";
    case "ammo":
      return "탄약";
    case "consumable":
      return "응급 물자";
    case "gear":
      return "보호 장비";
    case "quest":
      return "작전 기록";
    case "crafting":
      return "제작 재료";
    case "utility":
      return "현장 도구";
    case "barter":
      return "교환 물자";
    default:
      return "전체 물자";
  }
}

export function categoryShortLabel(category: string | null | undefined): string {
  switch (category) {
    case "weapon":
      return "전투";
    case "ammo":
      return "탄약";
    case "consumable":
      return "응급";
    case "gear":
      return "보호";
    case "quest":
      return "기록";
    case "crafting":
      return "재료";
    case "utility":
      return "도구";
    case "barter":
      return "교환";
    default:
      return "전체";
  }
}

export function rarityLabel(rarity: string | null | undefined): string {
  switch (rarity) {
    case "legendary":
      return "전설";
    case "epic":
      return "고급";
    case "rare":
      return "희귀";
    case "uncommon":
      return "보급";
    case "common":
      return "일반";
    default:
      return "미분류";
  }
}

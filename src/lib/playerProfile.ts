export const PLAYER_ROLES = [
  "경비원 출신",
  "배달 기사 출신",
  "약국 보조 출신",
  "건물 관리인 출신",
  "교회 봉사자 출신",
] as const;

export type PlayerRole = (typeof PLAYER_ROLES)[number];

export interface PlayerProfile {
  name: string;
  role: PlayerRole;
  callSign: string;
  dossierId: string;
  wristband: string;
  residentTier: string;
  assignedZone: string;
}

const profileKey = "donggri:player:profile";

function sanitizeName(name: string) {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 12) : "무명 입성자";
}

function createCodeFragment(seed: number) {
  return `${100 + (seed % 900)}`;
}

export function createPlayerProfile(
  name: string,
  role: PlayerRole = PLAYER_ROLES[0],
): PlayerProfile {
  const safeName = sanitizeName(name);
  const seed = Date.now();
  const initial = safeName.replace(/\s+/g, "").slice(0, 2) || "DG";

  return {
    name: safeName,
    role,
    callSign: `${initial}-${createCodeFragment(seed)}`,
    dossierId: `RB-${createCodeFragment(seed >> 2)}-${createCodeFragment(seed >> 5)}`,
    wristband: `TEMP-${createCodeFragment(seed >> 3)}`,
    residentTier: "임시입주",
    assignedZone: "B-17B",
  };
}

export function readPlayerProfile(): PlayerProfile | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(profileKey);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PlayerProfile;
  } catch {
    return null;
  }
}

export function writePlayerProfile(profile: PlayerProfile) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(profileKey, JSON.stringify(profile));
}

export function clearPlayerProfile() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(profileKey);
}

export function ensurePlayerProfile() {
  const existing = readPlayerProfile();

  if (existing) {
    return existing;
  }

  const fallback = createPlayerProfile("무명 입성자", PLAYER_ROLES[0]);
  writePlayerProfile(fallback);
  return fallback;
}

export function renderProfileText(text: string, profile: PlayerProfile) {
  return text
    .replaceAll("{name}", profile.name)
    .replaceAll("{role}", profile.role)
    .replaceAll("{callSign}", profile.callSign)
    .replaceAll("{dossierId}", profile.dossierId)
    .replaceAll("{wristband}", profile.wristband)
    .replaceAll("{assignedZone}", profile.assignedZone)
    .replaceAll("{residentTier}", profile.residentTier);
}

export type PatternTag = "stealth" | "observe" | "retreat" | "utility" | "weapon" | "armor" | "barrier" | "medical" | "water" | "light";
export type BattleAudioAction = "attack" | "guard" | "scan" | "retreat";

export interface LoadoutBonus {
  weaponChance: number;
  armorReduction: number;
  utilityChance: number;
  medicalChance: number;
  labels: string[];
}

export interface EncounterPattern {
  id: string;
  label: string;
  preview: string;
  tags: PatternTag[];
  baseChance: number;
  weight: number;
  relief: [number, number];
  failExposure: { injury: number; infection: number; noise: number; mental?: number; stamina?: number; fatalSeverity: number };
  staminaCost: number;
  audio: BattleAudioAction;
  successLog: string;
  partialLog: string;
  failLog: string;
  observedAfterUse?: boolean;
}

declare global {
  interface Window {
    __part1EncounterDebug?: {
      chapterId: string | null;
      nodeId: string | null;
      eventId: string | null;
      enemyGroupId: string;
      pressure: number;
      injury: number;
      infection: number;
      noise: number;
      offeredPatterns: Array<{ id: string; label: string; chance: number; tags: PatternTag[] }>;
    };
  }
}

function pattern(
  id: string,
  label: string,
  preview: string,
  tags: PatternTag[],
  baseChance: number,
  weight: number,
  relief: [number, number],
  exposure: EncounterPattern["failExposure"],
  staminaCost: number,
  audio: BattleAudioAction,
  successLog: string,
  partialLog: string,
  failLog: string,
  observedAfterUse = false,
): EncounterPattern {
  return { id, label, preview, tags, baseChance, weight, relief, failExposure: exposure, staminaCost, audio, successLog, partialLog, failLog, observedAfterUse };
}

export const ENCOUNTER_PATTERNS: EncounterPattern[] = [
  pattern("shadow_pass", "그림자 사이로 지난다", "몸을 낮추고 사각으로 비켜 간다.", ["stealth"], 0.58, 14, [28, 44], { injury: 10, infection: 7, noise: 4, stamina: -3, fatalSeverity: 8 }, 4, "scan", "[통과] 조명이 흔들리는 틈에 몸을 밀어 넣었다.", "[아슬한 통과] 거리는 벌렸지만 젖은 발소리가 따라붙었다.", "[노출] 바닥의 금속 조각이 크게 울렸다."),
  pattern("drip_timing", "물방울 박자에 맞춘다", "떨어지는 물소리에 발소리를 묻는다.", ["stealth", "water"], 0.62, 12, [24, 40], { injury: 8, infection: 6, noise: 5, stamina: -4, fatalSeverity: 7 }, 3, "scan", "[통과] 물방울이 떨어질 때마다 한 걸음씩 움직였다.", "[부분 성공] 박자는 맞췄지만 마지막 발이 물웅덩이를 건드렸다.", "[실패] 박자를 놓쳤다."),
  pattern("desk_crawl", "무너진 집기 밑으로 기어간다", "시야를 버리고 낮은 틈으로 몸을 접는다.", ["stealth"], 0.53, 10, [26, 42], { injury: 14, infection: 7, noise: 3, stamina: -6, fatalSeverity: 9 }, 5, "guard", "[통과] 철제 책상 밑으로 숨을 죽이고 빠져나왔다.", "[부분 성공] 빠져나왔지만 모서리가 팔을 찢었다.", "[걸림] 의자 다리가 철근에 걸렸다."),
  pattern("hold_breath", "숨을 멈추고 벽에 붙는다", "움직이지 않고 위협이 지나갈 때까지 기다린다.", ["stealth", "observe"], 0.6, 13, [18, 34], { injury: 6, infection: 5, noise: 2, mental: -5, fatalSeverity: 5 }, 2, "guard", "[대기] 숨을 끊자 위협이 코앞을 지나갔다.", "[부분 성공] 지나가긴 했지만 심장이 너무 크게 뛰었다.", "[흔들림] 참았던 숨이 먼저 새어 나왔다."),
  pattern("throw_debris", "잔해를 반대편으로 굴린다", "녹슨 금속 조각으로 소리의 방향을 바꾼다.", ["utility"], 0.55, 13, [30, 50], { injury: 7, infection: 5, noise: 9, mental: -2, fatalSeverity: 6 }, 2, "retreat", "[유인] 금속 조각이 복도 끝에서 울렸다.", "[부분 성공] 소리는 먹혔지만 너무 가까운 곳에서 멈췄다.", "[실패] 잔해가 발밑에서 멈췄다."),
  pattern("flash_lure", "빛을 다른 벽에 튕긴다", "손전등이나 반사면으로 시선을 유도한다.", ["utility", "light"], 0.5, 9, [28, 46], { injury: 9, infection: 6, noise: 5, mental: -2, fatalSeverity: 7 }, 3, "scan", "[유인] 빛이 벽을 스치자 위협이 그쪽으로 물렸다.", "[부분 성공] 시선은 흔들었지만 몸은 아직 안쪽에 묶여 있다.", "[실패] 빛이 튀어 위치를 드러냈다."),
  pattern("smoke_cover", "연막으로 시야를 닫는다", "연기를 먼저 보내 길목을 가리고 빠진다.", ["utility"], 0.66, 8, [38, 58], { injury: 6, infection: 4, noise: 8, mental: -2, fatalSeverity: 5 }, 3, "guard", "[연막] 흐린 막이 너와 위협 사이에 섰다.", "[부분 성공] 연기가 얇지만 통로 절반은 가렸다.", "[실패] 연기가 너무 늦게 퍼졌다."),
  pattern("quiet_door", "방화문을 조용히 닫는다", "문 하나를 사이에 두고 접근 압박을 낮춘다.", ["barrier"], 0.52, 10, [34, 54], { injury: 12, infection: 8, noise: 7, stamina: -4, fatalSeverity: 9 }, 4, "guard", "[차단] 잠금쇠가 끝까지 버텼다.", "[부분 성공] 문은 닫혔지만 오래 버티지 못한다.", "[실패] 문이 비틀리며 틈에 걸렸다."),
  pattern("bypass_route", "우회 통로로 돌아간다", "시간을 버리고 접촉 자체를 피한다.", ["retreat"], 0.64, 14, [18, 34], { injury: 8, infection: 5, noise: 5, stamina: -6, fatalSeverity: 6 }, 5, "retreat", "[우회] 늦어졌지만 살아 있는 길을 택했다.", "[부분 성공] 돌아가긴 했지만 우회 통로도 안전하지 않다.", "[실패] 막다른 복도로 너무 깊게 들어왔다."),
  pattern("erase_steps", "발자국을 지우며 물러선다", "추적 소리를 줄이며 후퇴한다.", ["retreat", "stealth"], 0.57, 8, [22, 38], { injury: 7, infection: 4, noise: 4, stamina: -5, fatalSeverity: 5 }, 4, "retreat", "[후퇴] 발자국이 물 위에서 흐려졌다.", "[부분 성공] 흔적은 줄었지만 시간이 너무 흘렀다.", "[실패] 쇠구멍이 금속판을 밟았다."),
  pattern("watch_cycle", "움직임의 주기를 센다", "달려드는 시간보다 멈추는 시간을 찾는다.", ["observe"], 0.78, 12, [12, 26], { injury: 3, infection: 2, noise: 1, mental: -3, fatalSeverity: 2 }, 1, "scan", "[관찰] 다음 선택의 성공률이 올라간다.", "[부분 성공] 멈추는 틈 하나를 봤다.", "[실패] 물소리와 숨소리가 겹쳤다.", true),
  pattern("listen_direction", "소리 방향을 다시 듣는다", "눈보다 귀를 먼저 믿는다.", ["observe"], 0.74, 11, [10, 22], { injury: 2, infection: 1, noise: 2, mental: -3, fatalSeverity: 2 }, 1, "scan", "[청음] 우회할 방향이 열렸다.", "[부분 성공] 소리는 읽었지만 거리가 생각보다 가깝다.", "[실패] 스피커 잡음이 모든 방향을 삼켰다.", true),
  pattern("shelf_block", "선반을 밀어 길을 막는다", "소음은 크지만 거리를 크게 벌릴 수 있다.", ["barrier", "armor"], 0.42, 8, [46, 68], { injury: 18, infection: 9, noise: 12, stamina: -9, fatalSeverity: 12 }, 8, "attack", "[차단] 선반이 무너지며 통로를 막았다.", "[부분 성공] 절반은 막았지만 틈으로 손이 들어온다.", "[실패] 선반이 반대로 기울었다."),
  pattern("rear_break_balance", "뒤에서 균형을 무너뜨린다", "죽이는 공격이 아니라 몇 초를 벌기 위한 제압이다.", ["weapon"], 0.36, 9, [42, 64], { injury: 24, infection: 15, noise: 8, mental: -4, fatalSeverity: 15 }, 9, "attack", "[제압] 균형이 무너지며 통로가 열렸다.", "[부분 성공] 넘어뜨리진 못했지만 방향을 꺾었다.", "[실패] 거리가 반 박자 모자랐다."),
  pattern("tool_keep_distance", "긴 도구로 거리를 벌린다", "무기는 공격력이 아니라 접촉 방지선이다.", ["weapon", "utility"], 0.46, 8, [32, 54], { injury: 16, infection: 10, noise: 7, stamina: -7, fatalSeverity: 11 }, 6, "attack", "[거리 확보] 도구 끝이 몸 사이에 들어갔다.", "[부분 성공] 거리는 벌렸지만 손목이 저렸다.", "[실패] 도구가 벽에 걸렸다."),
  pattern("armor_push", "보호 장비를 믿고 빠져나간다", "보호구가 있으면 위험을 줄이지만, 없으면 무모하다.", ["armor"], 0.34, 7, [34, 56], { injury: 28, infection: 14, noise: 8, stamina: -8, fatalSeverity: 16 }, 8, "guard", "[버팀] 보호구가 첫 접촉을 막았다.", "[부분 성공] 빠져나왔지만 충격이 늑골에 남았다.", "[실패] 보호구 없는 부위가 먼저 닿았다."),
  pattern("wrap_wound", "상처를 묶고 버틴다", "지금 무찌르기보다 출혈과 오염을 먼저 줄인다.", ["medical"], 0.63, 6, [8, 20], { injury: 3, infection: 2, noise: 2, mental: -2, fatalSeverity: 3 }, 2, "guard", "[응급 처치] 압박은 덜어졌다. 다음 움직임을 버틸 수 있다.", "[부분 성공] 피는 줄었지만 통증이 남았다.", "[실패] 매듭이 제대로 걸리지 않는다."),
  pattern("flare_or_light", "강한 빛으로 시선을 묶는다", "조명을 켜면, 반사광을 미끼로 쓴다.", ["utility", "light"], 0.52, 8, [34, 56], { injury: 8, infection: 5, noise: 8, mental: -2, fatalSeverity: 7 }, 3, "scan", "[시선 유도] 강한 빛이 먼저 물렸다.", "[부분 성공] 시선은 흔들었지만 오래 가지 않는다.", "[실패] 빛이 튀어 위치를 드러냈다."),
  pattern("water_cover_noise", "물결에 소리를 숨긴다", "찬 물소리로 발소리와 숨소리를 묻는다.", ["utility", "water"], 0.59, 7, [30, 52], { injury: 9, infection: 7, noise: 11, stamina: -5, fatalSeverity: 8 }, 5, "retreat", "[소리 숨김] 물소리가 복도를 삼켰다.", "[부분 성공] 발소리는 묻혔지만 물결은 오래 가지 않는다.", "[실패] 물결이 발밑으로 먼저 돌아왔다."),
  pattern("service_duct", "좁은 점검구로 들어간다", "몸이 걸릴 수 있지만 접촉 거리를 크게 줄인다.", ["retreat", "stealth"], 0.49, 7, [36, 58], { injury: 15, infection: 6, noise: 6, stamina: -7, fatalSeverity: 9 }, 7, "retreat", "[점검구] 철판 안쪽으로 몸이 들어갔다.", "[부분 성공] 빠져나왔지만 어깨가 깊게 긁혔다.", "[실패] 늑골이 걸렸다."),
  pattern("freeze_under_static", "잡음이 커질 때까지 멈춘다", "방송 잡음이 올라오는 순간만 움직인다.", ["stealth", "observe"], 0.61, 9, [20, 38], { injury: 6, infection: 5, noise: 3, mental: -4, fatalSeverity: 5 }, 2, "scan", "[정지] 잡음 아래로 숨소리가 묻혔다.", "[부분 성공] 한 번은 맞췄지만 다음 잡음이 짧다.", "[실패] 정적 속에서 발끝 소리만 남았다."),
  pattern("sacrifice_pack", "가방을 미끼로 던지고 빠진다", "물자를 잃을 수 있지만 몸은 비켜 간다.", ["utility", "retreat"], 0.57, 6, [36, 60], { injury: 8, infection: 5, noise: 5, mental: -5, fatalSeverity: 6 }, 3, "retreat", "[미끼] 가방이 먼저 끌려갔다.", "[부분 성공] 미끼는 먹혔지만 물자 하나를 잃었다.", "[실패] 가방끈이 손목에 걸렸다."),
  pattern("call_and_lock", "소리를 낸 뒤 잠금장치를 건다", "일부러 유인하고 문 하나를 사이에 둔다.", ["barrier", "utility"], 0.47, 6, [46, 70], { injury: 18, infection: 10, noise: 14, mental: -3, fatalSeverity: 13 }, 6, "guard", "[유인 차단] 문이 바로 뒤에서 잠겼다.", "[부분 성공] 잠금은 걸렸지만 문틀이 흔들린다.", "[실패] 잠금쇠가 헛돌았다."),
];
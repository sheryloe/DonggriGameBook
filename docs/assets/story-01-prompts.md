# Story 01 Asset Prompts

## 공통 규칙

- 세계관은 서울 좀비 생존, 여의도 안전지대, 야간 탐사 기반
- 공식 게임 캐릭터나 로고 직접 재현 금지
- 톤은 `건조한 생존 로그 + 공공기관 경보판 + 야간 작전 도식`
- 여의도는 깨끗한 미래 도시가 아니라 `재활용 행정 장치`처럼 보여야 한다
- 화면비는 `16:10`, `4:5`, `1:1` 중 용도에 맞게 고른다
- 텍스트가 포함될 경우 `한글 표지판 느낌`만 유지하고 실제 상표는 제거
- 공통 소품: `임시 봉인 스티커`, `배급표 펀치 마크`, `방수 천막`, `재활용 사무 가구`, `수기 공지`, `정전 시간표`, `플라스틱 차단막`, `응급 세척 구역`, `손등 스탬프`, `임시 코드 카드`
- 공통 마모 표현: `tape over tape`, `water stain`, `rusted fasteners`, `smudged stamp`, `reused signage`, `patched acrylic`, `handwritten correction marks`
- 공통 부정 제약: `no hero shot`, `no glam cyberpunk neon`, `no tactical operator cosplay`, `no recognizable brands`, `no game character likeness`
- 한국형 생존 시네마 문법: `좁은 병목`, `거주 자격`, `관리실 공지`, `배급 줄`, `소독 통로`, `줄을 서는 사람들`, `임시 보호소`, `외곽 회수 루트`

## Screen Set

### 1. Title Screen

`Post-apocalyptic Yeouido title screen, dark civic survival banner, monumental typography, distant apartment silhouette, rain-wet concrete, faint emergency lights, layered paper texture, dramatic negative space for menu buttons, collage-like official board feel, no characters, no logos`

### 2. Onboarding / Processing

`Registration and processing screen for a Korean survival safe zone, name input card, temporary code issuance, hand-stamp area, thermal scan frame, rule broadcast panel, queue numbers, medical tape, administrative collage UI, dry and oppressive, no characters`

### 3. Journal / Inventory Shell

`Survival journal and inventory shell inspired by a civic dossier, left-side log stack, central mission card, right-side status column, ration tags, storage slots, apartment notice paper, meter-like UI, recycled signage, handwritten corrections, gritty Korean post-collapse aesthetic`

### 4. Failure Screen

`Failure or quarantine screen for a Korean zombie survival gamebook, red administrative seal, conditional return stamp, quarantine warning card, empty corridor silhouette, severe minimal layout, oppressive black margins, official report tone, no gore, no hero pose`

## Scene Prompts

### intake

`Post-apocalyptic Yeouido checkpoint infographic, thermal queue grid, RB intake lane, Korean civic survival signage, orange alarm strips, reused acrylic panels, smudged stamp marks, documentary UI, no characters, no logos, high contrast`

### barracks

`Emergency dormitory schematic inside a survivor safe zone, B-17B bunk grid, ration punch card layout, teal lighting, reused furniture, handwritten correction marks, Korean labels, restrained dystopian infographic, apartment management notice vibe`

### briefing

`Mission briefing board with FR route code overlays, warning tape, hand-marked Seoul salvage map, yellow caution palette, dry government survival UI, patched signage, bottleneck corridor notes, no people`

### night-gate

`Blue night sortie gate schematic, W-03 service tunnel and collapsed entrance comparison, arrows, scan lines, Korean tactical interface, reused barricade materials, stark shadows, narrow passage pressure, no characters`

### arcade

`Abandoned shopping arcade salvage infographic, medicine shelves, vending machine stash markers, dusty but readable layout, pink hazard highlights, looted labels, handwritten salvage marks, shuttered storefront collage, no characters`

### collapse

`Zombie swarm waveform panel, broken glass corridor, red alert arcs, movement vectors, alert stamps, narrow emergency door, minimalist infographic instead of character art, bottleneck danger, no gore`

### contact

`Survivor negotiation board in ruined Seoul service corridor, battery trade indicators, trust risk markers, hand signal code chart, forged ID hints, muted violet signal light, apartment hallway tension, infographic mood, no character faces`

### return

`Checkpoint scanner dashboard for returning scavenger, N-01 verification beams, bio-risk detection bands, A-DEBT and Q-HOLD stamp hints, dystopian logistics interface, Korean labels, record ledger, no characters`

### endings

- `ending-clear`: `Approved mission dossier, green stamp, calm but tense survival bureaucracy aesthetic, clean administrative seal, qualified resident record`
- `ending-debt`: `Conditional return report, amber debt tag, reduced supplies ledger, bureaucratic survival infographic, resident debt notation`
- `ending-quarantine`: `Quarantine failure card, red medical warning seal, failed return record, oppressive empty infographic, resident hold notation`

## 무료 소스 대체 방향

- 사진을 써야 하면 도시 야경, 콘크리트 복도, 경고 표지판 같은 범용 이미지만 사용한다.
- 사람 얼굴이 강조된 사진보다 구조물, 표지, 실루엣 위주의 무료 이미지를 우선한다.
- 배경 사진이 너무 현대적이면 `낙서`, `테이프`, `표지판`, `문서 카드` 오버레이를 얹어 여의도 규율 사회의 질감을 만든다.
- 실제 사용 시 출처 필드를 `AssetSpec.credit`에 기록한다.

## 콜라주 가이드

- 실제 이미지가 없을 때는 `스크린샷형 콜라주`를 목표로 한다.
- 화면 위에 지도, 스탬프, 공지문, 셔터 실루엣, 경보 라인, 코드 카드, 분류표를 겹쳐서 한 장의 문서처럼 보이게 만든다.
- 데스크톱용은 좌우 분할, 모바일용은 상하 분할을 우선한다.
- 타이틀 화면은 넓은 여백과 강한 타이포그래피, 처리 화면은 폼과 스탬프, 본편 쉘은 카드와 패널, 실패 화면은 중앙 정렬 문서형 구성을 쓴다.

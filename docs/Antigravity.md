# Antigravity 운영 가이드 (현재 기준)

기준일: 2026-04-19
목표: 이미지 생성/동기화/검수, 포스터 우선 브리핑, 영상 프롬프트 경로를 한 번에 관리

## 1) Canonical 루트
- 프롬프트 루트: `private/prompts/antigravity`
- 이미지 inbox: `public/generated/images/inbox/P1`, `P2`, `P3`, `P4`
- 이미지 생성 결과: `public/generated/images`
- 패키징 결과: `private/generated/packaged/images`
- 영상 생성 결과: `public/generated/videos`

## 2) 영상 프롬프트/manifest 경로
아래 manifest를 기준으로 영상 프롬프트 JSON을 찾는다.

- `private/prompts/antigravity/part1-video-prompts/manifest.json`
- `private/prompts/antigravity/part2-video-prompts/manifest.json`
- `private/prompts/antigravity/part3-video-prompts/manifest.json`
- `private/prompts/antigravity/part4-video-prompts/manifest.json`

로딩 규칙
- 실제 프롬프트 파일은 manifest의 `file` 필드를 기준으로 로드한다.

출력 규칙
- 영상: `public/generated/videos/<video_id>.mp4`
- 포스터: `public/generated/images/<source_art_key>.webp`
- `target_poster_path`가 있는 경우 해당 경로를 우선 사용한다.

## 3) 브리핑 시작 화면 비주얼 규칙
`chapter_briefing`의 대표 비주얼은 아래 우선순위로 선택한다.

1. `result_card_art_key` (포스터)
2. `still_art_key`
3. `background_art_key`

즉, 포스터가 있으면 항상 포스터부터 보여준다.

## 4) 실행 명령 (PowerShell)
```powershell
Set-Location D:\Donggri_Platform\DonggrolGameBook

# 1) private 콘텐츠 검증
npm run private:check

# 2) runtime 산출물 생성
npm run private:export

# 3) 앱 빌드 검증
npm run build:apps

# 4) Part1 실행
npm run dev:part1 -- --host 127.0.0.1 --port 4171
```

## 5) UI 한글 깨짐 점검 기준
플레이어 노출 문자열 기준으로 아래가 0건이어야 통과.

- placeholder: `??`, `???`
- 깨짐 문자: ``
- mojibake 패턴(한자+한글 혼합 비정상 시퀀스)

검사 대상
- `private/content/ui/ch01~ch20.ui_flow.json`
- `packages/app-runtime/src/App.tsx`
- `public/runtime-content` 산출물

## 이미지 가이드
이미지 생성이 필요한 가이드 문서는 다음과 같다.
- `private/prompts/antigravity/part-guides/P1.md`
- `private/prompts/antigravity/part-guides/P2.md`
- `private/prompts/antigravity/part-guides/P3.md`
- `private/prompts/antigravity/part-guides/P4.md`

## 현재 만든 것
- [x] P1 이미지 `45 / 45`
- [x] P2 이미지 `45 / 45`
- [x] P3 이미지 `45 / 45`
- [ ] P4 이미지 `25 / 45`

현재 기준
- 전체 등록 이미지: `180`
- 현재 생성 완료 이미지: `144`
- 현재 남은 이미지: `36`

## 현재 남은 것
### P2
- [x] P2 이미지 전량 생성 완료 (Done)

### P3
- [x] P3 이미지 전량 생성 완료 (Done)

### P4
- [ ] 이미지 `20`개 추가 생성 (CH18 남수련 초상화부터 재개 예정)

## 6) 운영 체크 포인트
- 포스터가 시작 브리핑(챕터 첫 화면)에서 노출되는지 확인
- CH01/CH06/CH10/CH16/CH20 진입 시 한글 깨짐이 없는지 확인
- 영상 생성 전에는 manifest 경로와 `file` 필드만 먼저 확정
- 이미지 생성 시 폴더 추측 금지, `MASTER_ASSET_MANIFEST.json` 기준으로 정렬
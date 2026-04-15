# Antigravity

## 목적
- 이 문서는 Antigravity 이미지 작업의 canonical 실행 문서다.
- 기준 경로는 `private/prompts/antigravity`다.
- 구경로 `docs/asset-prompt-pack`는 더 이상 기준으로 쓰지 않는다.

## 기준 경로
```text
D:\Donggri_Platform\DonggrolGameBook\private\prompts\antigravity
├─ chapters\CHxx_*\
├─ master\
├─ item-icons\
├─ part-guides\
├─ part1-video-prompts\
├─ part2-video-prompts\
├─ part3-video-prompts\
├─ part4-video-prompts\
├─ part1-poster-prompts\
├─ part2-poster-prompts\
├─ part3-poster-prompts\
└─ part4-poster-prompts\
```

## 핵심 파일
- 마스터 manifest: `private/prompts/antigravity/master/MASTER_ASSET_MANIFEST.json`
- runtime art alias: `private/prompts/antigravity/master/RUNTIME_ART_KEY_ALIAS.json`
- stitch render queue: `private/prompts/antigravity/master/STITCH_RENDER_QUEUE.json`
- stitch item icon queue: `private/prompts/antigravity/master/STITCH_ITEM_ICON_QUEUE.json`
- 파트 가이드:
  - `private/prompts/antigravity/part-guides/P1.md`
  - `private/prompts/antigravity/part-guides/P2.md`
  - `private/prompts/antigravity/part-guides/P3.md`
  - `private/prompts/antigravity/part-guides/P4.md`

## 결과물 경로
- 이미지 inbox:
  - `public/generated/images/inbox/P1`
  - `public/generated/images/inbox/P2`
  - `public/generated/images/inbox/P3`
  - `public/generated/images/inbox/P4`
- 아이콘 inbox: `public/generated/icons/inbox`
- sync 결과:
  - `public/generated/images`
  - `private/generated/packaged/images`

## 작업 규칙
1. 파일명은 반드시 `filename_target` 그대로 사용한다.
2. `asset_id`, `art_key_final`, `filename_target`, `target_path`는 임의로 바꾸지 않는다.
3. 결과물은 항상 `inbox`에 먼저 넣는다.
4. `--dry-run` 확인 없이 바로 sync 하지 않는다.
5. 먼저 파트 가이드를 읽고 챕터 프롬프트로 내려간다.
6. 이 문서에는 실행 규칙만 둔다.
7. 스토리 설계와 장면 의미는 `private/story/world/design` 문서를 기준으로 본다.

## 상태 판정
- `Completed`: `public/generated` 또는 `private/generated/packaged`에 실제 결과 파일이 있다.
- `Ready`: `inbox`에는 파일이 있지만 sync 결과가 아직 없다.
- `Missing`: manifest/prompt는 있는데 실제 파일이 없다.

## 기본 명령
```powershell
Set-Location D:\Donggri_Platform\DonggrolGameBook
```

## 프롬프트 생성
```powershell
npm run asset-prompts:generate
npm run asset-prompts:generate:part1
npm run asset-prompts:generate:part2
npm run asset-prompts:generate:part3
npm run asset-prompts:generate:part4
npm run asset-prompts:item-icons
npm run audio-prompts:boss
```

## 챕터 프롬프트 열기
```powershell
ii .\private\prompts\antigravity\chapters\CH16_fracture_harbor
Get-Content .\private\prompts\antigravity\chapters\CH16_fracture_harbor\background\bg_primary.md -Raw | Set-Clipboard
```

## 렌더 큐 확인
```powershell
$Queue = Get-Content .\private\prompts\antigravity\master\STITCH_RENDER_QUEUE.json -Raw | ConvertFrom-Json
$Queue.tasks |
  Where-Object { $_.kind -eq 'image' -and $_.part_id -eq 'P4' } |
  Select-Object task_id, chapter_id, prompt_file, target_path |
  Format-Table -AutoSize
```

## 이미지 sync
```powershell
npm run assets:sync -- --part P4 --dry-run
npm run assets:sync -- --part P4
npm run assets:sync -- --dry-run
npm run assets:sync
```

## 아이콘 처리
```powershell
ii .\public\generated\icons\inbox
npm run assets:item-icons:crop
```

## 콘텐츠 반영
```powershell
npm run private:check
npm run private:export
```

## 대시보드
```powershell
npm run dashboard:media-sync
ii .\media-sync-dashboard.html

npm run dashboard:modern
ii .\modern-ops-dashboard.html
```

## inbox 열기
```powershell
ii .\public\generated\images\inbox\P1
ii .\public\generated\images\inbox\P2
ii .\public\generated\images\inbox\P3
ii .\public\generated\images\inbox\P4
```

## 체크리스트
- 파트 가이드를 먼저 읽었는가
- 프롬프트 경로가 `private/prompts/antigravity` 기준인가
- 파일명을 `filename_target`에 맞췄는가
- 올바른 Part inbox에 넣었는가
- `assets:sync -- --dry-run` 결과가 깨끗한가
- `private:check`, `private:export`가 통과하는가

## 금지
- `private/`, `public/generated/`, `public/runtime-content/`를 Git에 올리지 않는다.
- 프롬프트 결과물을 publish 경로로 직접 복사하지 않는다.
- 구경로 문서를 기준으로 작업하지 않는다.

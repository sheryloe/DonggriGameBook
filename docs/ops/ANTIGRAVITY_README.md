# ANTIGRAVITY README

## 목적
- Antigravity 이미지 프롬프트 작업 기준 문서
- Git 추적 대상은 이 문서와 스크립트만 유지
- 실제 프롬프트, 스토리, 생성 결과물은 모두 `private/` 또는 `public/generated/` 기준으로 운영

## Canonical 경로
```text
D:\Donggri_Platform\DonggrolGameBook\private\prompts\antigravity
├─ chapters\CHxx_*\
├─ master\
├─ item-icons\
├─ part1-video-prompts\
├─ part2-video-prompts\
├─ part3-video-prompts\
├─ part4-video-prompts\
├─ part2-poster-prompts\
├─ part3-poster-prompts\
└─ part4-poster-prompts\
```

## 핵심 파일
- 마스터 자산 manifest
  - `private\prompts\antigravity\master\MASTER_ASSET_MANIFEST.json`
- 런타임 art key alias
  - `private\prompts\antigravity\master\RUNTIME_ART_KEY_ALIAS.json`
- Stitch render queue
  - `private\prompts\antigravity\master\STITCH_RENDER_QUEUE.json`
- 챕터 프롬프트
  - `private\prompts\antigravity\chapters\CHxx_*\...`
- 아이콘 프롬프트
  - `private\prompts\antigravity\item-icons\<item_id>\item_icon.md`

## 이미지 생성 결과 드롭 경로
- Part 1: `public\generated\images\inbox\P1`
- Part 2: `public\generated\images\inbox\P2`
- Part 3: `public\generated\images\inbox\P3`
- Part 4: `public\generated\images\inbox\P4`

## 작업 순서
1. 프롬프트 생성
2. Part/Chapter 폴더에서 필요한 `.md` 프롬프트 열기
3. Antigravity 웹에서 이미지 생성
4. `filename_target` 그대로 저장
5. 해당 Part inbox에 드롭
6. `assets:sync`로 public/private packaged 경로 동기화
7. `private:export`로 런타임 JSON 갱신
8. `dashboard:media-sync`로 상태 확인

## PowerShell 명령
### 1. 전체 프롬프트 재생성
```powershell
Set-Location D:\Donggri_Platform\DonggrolGameBook
npm run asset-prompts:generate
```

### 2. Part별 프롬프트 생성
```powershell
Set-Location D:\Donggri_Platform\DonggrolGameBook
npm run asset-prompts:generate:part1
npm run asset-prompts:generate:part2
npm run asset-prompts:generate:part3
npm run asset-prompts:generate:part4
```

### 3. 특정 챕터 폴더 열기
```powershell
ii .\private\prompts\antigravity\chapters\CH16_fracture_harbor
```

### 4. 프롬프트 열기 + 복사
```powershell
Get-Content .\private\prompts\antigravity\chapters\CH16_fracture_harbor\background\bg_primary.md -Raw | Set-Clipboard
```

### 5. 동기화 전 점검
```powershell
Set-Location D:\Donggri_Platform\DonggrolGameBook
npm run assets:sync -- --part P4 --dry-run
```

### 6. 실제 동기화
```powershell
Set-Location D:\Donggri_Platform\DonggrolGameBook
npm run assets:sync -- --part P4
```

### 7. 런타임 export
```powershell
Set-Location D:\Donggri_Platform\DonggrolGameBook
npm run private:check
npm run private:export
```

### 8. 상태 대시보드 생성
```powershell
Set-Location D:\Donggri_Platform\DonggrolGameBook
npm run dashboard:media-sync
ii .\media-sync-dashboard.html
```

### 9. 운영 대시보드(Part 1~4) 생성
```powershell
Set-Location D:\Donggri_Platform\DonggrolGameBook
npm run dashboard:modern
ii .\modern-ops-dashboard.html
```

## 파일명 규칙
- Antigravity 저장 파일명은 반드시 `filename_target` 그대로 사용
- 확장자는 `.png`, `.webp`, `.jpg`, `.jpeg`, `.svg` 허용
- `art_key_final`은 runtime/public/private packaged 공통 키로 유지
- `asset_id`, `art_key_final`, `filename_target` 임의 변경 금지

## 동기화 결과 경로
### public runtime 미리보기
- `public\generated\images\<art_key_final>.<ext>`
- `public\generated\images\<filename_target>`

### private packaged 보관 경로
- `private\generated\packaged\images\bg\`
- `private\generated\packaged\images\portrait\`
- `private\generated\packaged\images\threat\`
- `private\generated\packaged\images\poster\`
- `private\generated\packaged\images\teaser\`
- `private\generated\packaged\images\items\`

## 아이콘 작업
### 프롬프트 생성
```powershell
Set-Location D:\Donggri_Platform\DonggrolGameBook
npm run asset-prompts:item-icons
```

### 소스 이미지를 inbox에 저장
- `public\generated\icons\inbox\<item_id>_source_v01.png`

### crop + publish
```powershell
Set-Location D:\Donggri_Platform\DonggrolGameBook
npm run assets:item-icons:crop
```

## 보스 음악 프롬프트
```powershell
Set-Location D:\Donggri_Platform\DonggrolGameBook
npm run audio-prompts:boss
```

## 검수 기준
- inbox에만 있고 sync 결과가 없으면 `Ready`
- public 또는 private packaged 결과가 있으면 `Completed`
- prompt만 있고 결과가 없으면 `Missing`
- SVG를 raster target에 넣는 경우 `format mismatch` 처리

## 주의
- Git에 `private/`, `public/generated/`, `public/runtime-content/`를 올리지 않는다
- 스토리/챕터/프롬프트/이미지/음악/영상은 전부 개인 소유 콘텐츠로 취급한다
- 앱 런타임은 `public/runtime-content`와 `public/generated`만 읽는다

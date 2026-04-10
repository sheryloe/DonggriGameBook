# Asset Prompt Pack

## 목적
- `CH01~CH20` 전체 이미지를 웹 GPT에서 바로 생성할 수 있게 프롬프트를 챕터 단위로 정리한다.
- 실제 산출물은 나중에 `codex_webgame_pack/img/*`로 동기화하고, 이 폴더는 프롬프트와 매니페스트만 관리한다.

## 구조
```text
docs/asset-prompt-pack/
  README.md
  master/
    MASTER_ASSET_MANIFEST.json
    RUNTIME_ART_KEY_ALIAS.json
    SYNC_CHECKLIST.md
  part-guides/
    P1.md
    P2.md
    P3.md
    P4.md
  chapters/
    CH01_*/
      chapter_manifest.json
      background/
      portrait/
      threat/
      poster/
      teaser/
```

## 생성 순서
1. part guide를 읽고 파트 분위기를 잠근다.
2. chapter manifest를 보고 챕터별 9개 자산을 확인한다.
3. 각 프롬프트 파일의 English Prompt를 웹 GPT에 넣어 이미지를 생성한다.
4. 결과 파일명을 `filename_target`에 맞춰 저장한다.
5. 검수 후 `codex_webgame_pack/img/*`로 동기화한다.

## 동기화 규칙
- 배경: `codex_webgame_pack/img/bg/`
- 인물: `codex_webgame_pack/img/portrait/`
- 위협: `codex_webgame_pack/img/threat/`
- 포스터: `codex_webgame_pack/img/poster/`
- 티저 프레임: `codex_webgame_pack/img/teaser/`
- `art_key_final`과 `filename_target`을 임의로 바꾸지 않는다.

## 비율 규칙
- background: `16:10`
- portrait: `4:5`
- threat: `4:5`
- poster: `4:5`
- teaser: `16:9`

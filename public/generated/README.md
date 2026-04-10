# Part 1 Generated Media Drop Guide

Drop Part 1 media files into this folder tree and refresh the app.

## Folder Contract

```text
public/generated/
  images/
  videos/
  meta/
    examples/
```

## Images

- Location: `public/generated/images`
- Filename: `<art_key>.webp`
- Supported fallback extensions: `.png`, `.jpg`, `.jpeg`
- Resolution rule: `.webp` is preferred, then `.png`, `.jpg`, `.jpeg`

Examples:

```text
public/generated/images/briefing_p1_ch01.webp
public/generated/images/map_p1_ch03.webp
public/generated/images/ending_p1_signal_keepers.webp
public/generated/images/ending_thumb_p1_signal_keepers.webp
```

## Videos

- Location: `public/generated/videos`
- Filename: `<video_id>.mp4`
- Supported format: `.mp4` only
- Auto-surfaced in-app:
  - `P1_CH01_OPENING` ~ `P1_CH05_OPENING`
  - `P1_END_SIGNAL_KEEPERS`
  - `P1_END_CONTROLLED_PASSAGE`
  - `P1_END_SMUGGLER_TIDE`
  - `P1_END_ASHEN_ESCAPE`
  - `P1_END_MIRROR_WITNESS`
- `P1_TRAILER_MAIN.mp4` may be stored here, but it is not auto-rendered in the app.

Examples:

```text
public/generated/videos/P1_CH01_OPENING.mp4
public/generated/videos/P1_END_SIGNAL_KEEPERS.mp4
```

## Meta JSON

- Location: `public/generated/meta`
- Filename: `<asset_or_video_id>.json`
- Optional file. If absent, the app falls back to built-in title/subtitle/caption text.

Supported fields:

```json
{
  "title": "Signal Keepers",
  "subtitle": "Hope carried under seal",
  "caption": "The archives move south with the survivors.",
  "credit": "Artist or tool credit",
  "chapter_id": "CH05",
  "ending_id": "P1_END_SIGNAL_KEEPERS"
}
```

Examples are in `public/generated/meta/examples`.

## Refresh Behavior

- Development: add or replace files, then refresh the browser.
- Preview/build: replace files in `public/generated`, redeploy or refresh the served build.

## Missing Image Behavior

- Part 1 drop-ready art keys do **not** fall back to scenic legacy backgrounds.
- If an expected image file is missing, the app shows a deliberate `X` placeholder card.
- The placeholder exposes:
  - asset key
  - screen label
  - expected path

This is intentional so missing assets are visible immediately.

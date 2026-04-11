# Part 2-4 Presentation Package

## Scope
- Repo-native presentation package for Part 2-4 only.
- Covers prompt pipeline expansion for openings, endings, trailers, and posters.
- Provides a slide-deck artifact in Markdown and self-contained HTML.

## Inventory
| Part | Playtime | Openings | Endings | Trailer | Posters |
| --- | --- | --- | --- | --- | --- |
| P2 | 30m | 5 | 5 | 1 | 3 |
| P3 | 30m | 5 | 5 | 1 | 3 |
| P4 | 40m | 5 | 3 | 1 | 3 |

## Generation
```powershell
Set-Location D:\Donggri_Platform\DonggrolGameBook
node scripts/generate-asset-prompt-pack.mjs
node scripts/generate-presentation-deck.mjs
```

## Outputs
- docs/world/presentation/PRESENTATION_SUMMARY.md
- docs/world/presentation/KEYART_SELECTION.md
- docs/world/presentation/PROMPT_BUNDLE_INDEX.md
- docs/world/presentation/PLAYTIME_ENDINGS_BRANCHING_SLIDES.md
- docs/world/presentation/DEMO_CHECKLIST.md
- docs/world/presentation/PARTS_2_4_SHOWCASE_DECK.html

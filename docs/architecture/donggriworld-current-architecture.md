# DonggriWorld Architecture

## 1. Runtime

- App stack: `Vite + React + TypeScript + React Router`
- Deployment target: `Cloudflare Pages`
- Client rendering: SPA
- Build output: `dist`
- Persistent state: `sessionStorage` for Story run memory, `localStorage` for player profile

## 2. Story Runtime

### Story 1

- Theme: Yeouido entry, residency politics, night sortie, return judgment
- Current runtime shape: `10+ minute` episode target
- Structure: onboarding/processing prologue, mid-route pressure scenes, three ending outcomes
- Core state: `supplies`, `noise`
- Outcome families:
  - `ending-clear`
  - `ending-debt`
  - `ending-quarantine`

### Story 2

- Theme: outer supply route, transport burden, checkpoint friction
- Reuses the same engine and two-state model
- Starts from Yeouido’s outward logistics rather than the entry ceremony
- Outcome families:
  - `ending-clear`
  - `ending-debt`
  - `ending-quarantine`

## 3. Routing

- Base landing: `/`
- Story 1 route base: `/story/1/:nodeId`
- Story 2 route base: `/story/2/:nodeId`
- Direct URL entry is required for every playable node
- Story pages should behave as SPA routes and survive refresh

## 4. Asset Model

- Story assets live in `src/data/story1Assets.ts` and `src/data/story2Assets.ts`
- Asset references should reuse local SVG or infographic patterns when possible
- Visual keys must cover every playable node, including non-ending mid-route scenes and endings
- Binary assets are optional and should only be added when SVG reuse is insufficient

## 5. Docker Test Flow

### Purpose

- Verify the built SPA in a static server container before Pages deployment

### Flow

1. Run `npm run build`
2. Serve `dist` through the Docker/nginx test container
3. Check `/`, Story 1 direct routes, and Story 2 direct routes
4. Confirm refresh-safe navigation
5. Tear down the container after review

### What to verify

- Route fallback works on direct navigation
- Story loading and ending states render correctly
- Mobile layout remains readable in a narrow viewport
- Asset images and infographic panels resolve correctly

## 6. Docs and Agent Outputs

### World and PRN docs

- World bible: `docs/world/yeouido-world-bible.md`
- Story 1 PRN: `docs/prn/story-01.md`
- Story 2 PRN: `docs/prn/story-02.md`
- Cloudflare Pages PRN: `docs/prn/cloudflare-pages-integration.md`

### Architecture docs

- Current architecture: `docs/architecture/donggriworld-current-architecture.md`

### Asset prompt docs

- Story 1 prompts: `docs/assets/story-01-prompts.md`
- Story 2 prompts: `docs/assets/story-02-prompts.md`

### Local assets

- Story 1 assets: `src/data/story1Assets.ts`
- Story 2 assets: `src/data/story2Assets.ts`
- SVG sources: `src/assets/*`

### Agent output footprint

- Agent-generated or agent-refined content should remain bounded to docs, data manifests, and asset instructions.
- Do not rely on agent output as a source of truth unless it is reflected in the world bible or PRN files.

## 7. Integration Rules

- Keep Story 1 and Story 2 consistent with the same two-state model.
- Keep the UI vocabulary aligned across routes: entry, processing, journal, inventory, dossier, signal, ending.
- Any new scene should be added to the story data and asset manifest together.
- Any deployment change should be reflected in the Cloudflare Pages PRN and the architecture doc.


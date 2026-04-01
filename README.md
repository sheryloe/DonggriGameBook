# Donggri Gamebook

여의도 안전지대 신규 입성자의 첫 야간 탐사를 다루는 React 기반 웹 게임북 프로토타입이다.

## Commands

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run verify:story`

## AdSense Slot

- 기본적으로는 `AdSense Ready` 플레이스홀더만 보인다.
- 실제 광고를 붙이려면 `.env.local`에 아래 값을 넣는다.
  - `VITE_ADSENSE_CLIENT`
  - `VITE_ADSENSE_SLOT`
- 예시는 [`.env.example`](/mnt/d/SYSRND/Codex/DonggriGamebook/.env.example)에 있다.

## Docker

- Build image:
  - `docker build -t donggri-gamebook:test .`
- Run container:
  - `docker run --rm -d --name donggri-gamebook-test -p 18080:80 donggri-gamebook:test`
- Open:
  - `http://127.0.0.1:18080/`
  - `http://127.0.0.1:18080/story/1/night-gate`
  - `http://127.0.0.1:18080/story/1/ending-clear`
- Stop and delete:
  - `docker stop donggri-gamebook-test`

## Cloudflare Pages

- Framework preset: `Vite`
- Build command: `npm run build`
- Build output directory: `dist`
- SPA fallback: [`public/_redirects`](/mnt/d/SYSRND/Codex/DonggriGamebook/public/_redirects)
- Deployment PRN: [`docs/prn/cloudflare-pages-integration.md`](/mnt/d/SYSRND/Codex/DonggriGamebook/docs/prn/cloudflare-pages-integration.md)

## Key Files

- [`src/data/story1.ts`](/mnt/d/SYSRND/Codex/DonggriGamebook/src/data/story1.ts)
- [`src/data/story2.ts`](/mnt/d/SYSRND/Codex/DonggriGamebook/src/data/story2.ts)
- [`src/lib/storyEngine.ts`](/mnt/d/SYSRND/Codex/DonggriGamebook/src/lib/storyEngine.ts)
- [`docs/world/yeouido-world-bible.md`](/mnt/d/SYSRND/Codex/DonggriGamebook/docs/world/yeouido-world-bible.md)
- [`docs/prn/story-01.md`](/mnt/d/SYSRND/Codex/DonggriGamebook/docs/prn/story-01.md)
- [`docs/prn/story-02.md`](/mnt/d/SYSRND/Codex/DonggriGamebook/docs/prn/story-02.md)
- [`docs/prn/cloudflare-pages-integration.md`](/mnt/d/SYSRND/Codex/DonggriGamebook/docs/prn/cloudflare-pages-integration.md)
- [`docs/architecture/donggriworld-current-architecture.md`](/mnt/d/SYSRND/Codex/DonggriGamebook/docs/architecture/donggriworld-current-architecture.md)
- [`docs/architecture/agent-structure.md`](/mnt/d/SYSRND/Codex/DonggriGamebook/docs/architecture/agent-structure.md)
- [`.codex/agents/README.md`](/mnt/d/SYSRND/Codex/DonggriGamebook/.codex/agents/README.md)
- [`docs/assets/story-01-prompts.md`](/mnt/d/SYSRND/Codex/DonggriGamebook/docs/assets/story-01-prompts.md)

## Agents

- Project-local agents live in [`.codex/agents`](/mnt/d/SYSRND/Codex/DonggriGamebook/.codex/agents).
- The repo keeps a selected DonggriWorld-focused set instead of mirroring all of `awesome-codex-subagents`.
- Role layout and usage notes are documented in [`docs/architecture/agent-structure.md`](/mnt/d/SYSRND/Codex/DonggriGamebook/docs/architecture/agent-structure.md).

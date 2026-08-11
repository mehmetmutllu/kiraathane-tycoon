# Köşe Kıraathanesi 🫖 — 3D Idle-Tycoon Game

**Store-quality 3D idle-tycoon mobile game set in a Turkish tea house (kıraathane), built with TypeScript, React Three Fiber, Rapier physics and Zustand — with a simulated game economy and a multi-session AI-assisted development workflow.**

Grow a neighborhood tea house from scratch: tea service, kitchen, waiters, okey/backgammon tables, a hookah terrace.

**Core loop:** NPC orders → (waiter) carries → customer pays → money drops on the floor → collect it with the owner character → upgrade & expand with build pads → prestige ("Renovation").

## Architecture & Engineering

- **`src/config/economy.config.ts` — single source of truth for every balance number.** No magic numbers scattered through gameplay code; the whole economy is tuned in one file.
- **Economy simulation before gameplay** — `npm run sim` runs the progression curve headlessly (`tools/simulate.ts`), so pacing/prestige balance is validated numerically instead of by feel.
- **Deterministic game state in Zustand** — simulation, save/load with **save-data migrations**, and big-number progression via `break_infinity.js`.
- **Physics & rendering** — React Three Fiber + drei + Rapier + postprocessing; low-poly stylized, greybox-first art direction.
- **Testing** — Vitest logic tests (`tests/logic.test.ts`) + a **headless browser smoke test** (`node tools/smoke.mjs`) that boots the real game in a browser.
- **Dev console hooks** — `__game()`, `__advanceTime(60)`, `__resetGame()` for fast state inspection and time-travel while balancing.
- **Multi-session AI-assisted workflow** — the repo carries its own persistent development context: `memory-bank/` (project brief, architecture, decisions, progress, active context) and custom Claude Code skills (`.claude/skills/`) for session continue/save. Engine choice rationale (why not Unity) is recorded in `memory-bank/decisions.md`.

## Tech Stack

TypeScript · Vite · React 19 · React Three Fiber (drei / rapier / postprocessing) · Zustand · break_infinity.js
Mobile (planned phases): Capacitor + RevenueCat + AdMob — with an ethical, child-safe monetization plan documented in `docs/`.

## Project Layout

- `memory-bank/` — multi-session development memory (brief, architecture, progress, active context, decisions)
- `docs/` — game design, economy, monetization and asset planning
- `src/config/economy.config.ts` — the one place all balance numbers live
- `src/game/` — Zustand store + simulation, save/migration, Decimal math
- `src/components/three|ui/` — 3D scene and HUD/joystick
- `tests/`, `tools/` — logic tests, economy simulator, browser smoke test

## Running Locally

```bash
npm install
npm run dev            # dev server (http://localhost:5173)
npm run build          # type-check + production build
npm run test           # Vitest logic tests
npm run sim            # economy curve simulation
node tools/smoke.mjs   # headless browser smoke test (with dev server running)
```

## Status

Phase 0 (planning) and Phase 1 (3D greybox vertical slice) complete; next up: kitchen + waiter phase. Detailed phase tracking lives in `memory-bank/progress.md`.

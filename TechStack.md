# TechStack.md — Jenil & Rutu 3D Museum

## 1. Summary

A **fully static** single-page web app. No backend, no database, no API keys, no paid services. Everything is bundled and served from a CDN-hosted `dist/` folder.

| Layer | Choice | Why |
|---|---|---|
| Language | **TypeScript 5.x** (strict) | Catches mistakes early; Vite compiles it with zero config |
| Bundler / dev server | **Vite** (latest stable) | Fast, static output, `base: './'` for any host path |
| 3D engine | **Three.js** (latest stable, pin the exact version in `package.json`) | De-facto standard for WebGL, huge ecosystem, GLTF support |
| 3D helpers | `three/examples/jsm`: `GLTFLoader`, `RoomEnvironment`, `EffectComposer` + `UnrealBloomPass` + `OutputPass` | Optional GLB characters, nice reflections, optional bloom |
| UI overlays | **Plain HTML + CSS** (no React/Vue) | Small, fast; HUD, menus, viewers, joystick are simple DOM |
| State | Small hand-written **finite state machine** (`src/core/stateMachine.ts`) | Deterministic, unit-testable endings flow |
| Audio | **Web Audio API** + `HTMLAudioElement` | Procedural footsteps/ambience + optional `bgm.mp3` |
| Textures | Procedural **canvas textures** (floor, walls, boards, plaques, placeholders) | No binary assets needed; user media is drop-in |
| Unit tests | **Vitest** (+ `happy-dom` only if needed) | Pure-logic tests (layout, collision, FSM, resolver) |
| E2E tests | **Playwright** (Chromium) | Real browser, real WebGL (software), mobile emulation |
| Deploy | **Vercel CLI** (primary), Netlify CLI or GitHub Pages (fallback) | Free static hosting, gives the live link |
| Runtime | **Node.js ≥ 20 LTS**, npm | Standard |

## 2. Explicitly NOT used
- No React / Vue / Svelte, no physics engine (custom 2D collision is simpler and exact for this layout).
- No server, no database, no auth, no analytics, no external fonts or CDN scripts at runtime.
- No copyrighted models, music, textures. Any extra asset must be generated procedurally or be CC0 and recorded in `README.md`.

## 3. npm scripts (must all exist and work)

| Script | Does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | `tsc --noEmit` then `vite build` → `dist/` |
| `npm run preview` | Serve `dist/` locally (used by Playwright) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run placeholders` | Run `scripts/make-placeholders.mjs` (generates `P1–P8.svg`) |
| `npm run test:unit` | Vitest, all `tests/unit` |
| `npm run test:e2e` | Playwright, desktop + mobile projects, against `preview` |
| `npm run test:all` | typecheck → unit → build → e2e; exits non-zero on any failure |
| `npm run test:live` | Playwright E-13 against `LIVE_URL=<url>` |
| `npm run deploy` | Build and deploy to the chosen host |

## 4. Playwright configuration notes
- Chromium launch args for software WebGL in headless/CI: `--use-angle=swiftshader`, `--enable-unsafe-swiftshader`, `--ignore-gpu-blocklist`, `--enable-webgl`.
- Projects: `desktop` (1280×720) and `mobile` (390×844, `hasTouch: true`, `isMobile: true`).
- `webServer`: `npm run preview` on a fixed port; `use.baseURL` from it; override with `LIVE_URL` for E-13.
- All tests open the app with `?test=1` (enables `window.__MUSEUM__`, skips the intro, shortens only the non-essential cinematic delays; the Exit-2 hell sequence must still run at its real duration in at least one test).
- Fail a test on any `console.error`, `pageerror`, or failed request (4xx/5xx) except the intentionally missing optional media files (`P?.jpg`, `V?.mp4`, `bgm.mp3`, `*.glb`) — those must be handled silently (probe with `HEAD`, or try in order and swallow).
- Save traces/screenshots on failure; write the HTML report to `docs/verification/`.

## 5. Browser & device targets
- Desktop: latest Chrome, Edge, Firefox, Safari.
- Mobile: iOS Safari 16+, Android Chrome (mid-range phone, 2021 or newer).
- WebGL2 required; show a friendly fallback message if unavailable.

## 6. Performance budgets
| Metric | Target |
|---|---|
| Initial download (without user media) | ≤ 15 MB, ideally < 5 MB |
| Time to character-select on broadband | ≤ 4 s |
| Desktop FPS | 60 |
| Mobile FPS | ≥ 30 (auto-lower pixel ratio, disable bloom + shadows if < 28 FPS for 3 s) |
| Draw calls | < 400 (merge static geometry, reuse materials; use `InstancedMesh` for repeated items) |
| Triangles | < 600 000 |
| Real-time lights | ≤ 8, shadow-casting lights ≤ 2 |
| User textures | Downscale in the loader to ≤ 2048 px on the long side; mipmaps + anisotropy 4–8 |

## 7. Code quality
- TypeScript `strict: true`; no `any` except at the debug API boundary.
- ESLint optional; if added it must pass in `test:all`.
- Dispose of geometries/materials/textures when leaving the Hell scene (no leaks across retries — verify in E-09 that `renderer.info.memory` does not grow across 3 retries by more than 10 %).
- Time-step: fixed 1/60 s logic step with accumulator, rendering interpolated; `dt` clamped to 0.1 s; collision sub-steps ≤ 0.1 m.

# INSTRUCTION.md — The Jenil & Rutu 3D Museum

> Master brief for the AI coding agent (Antigravity).
> Read order: `INSTRUCTION.md` (this file) → `TechStack.md` → `Architecture.md` → look at `reference/blueprint.jpg`.

---

## 0. Precedence rules

1. `Architecture.md` — authoritative for geometry (coordinates), behaviour, timings.
2. `INSTRUCTION.md` — authoritative for scope, texts, content rules, tests, delivery.
3. `TechStack.md` — authoritative for tools and versions.
4. `reference/blueprint.jpg` — a rough hand drawing. It shows *intent only*.

If two sources conflict, follow the higher one and list the conflict in the final report. Never silently drop a requirement. Never invent extra rooms that are not in the blueprint.

---

## 1. What we are building

A **website containing a walkable 3D museum**, generated from the hand-drawn blueprint. It is a personal surprise that **Jenil** sends to **Rutu**.

- The visitor opens the link, chooses a character (**Jenil** = male, **Rutu** = female), and walks through the museum from the **Entry**.
- Along the walls there are **photo frames (P)**, **video screens (V)** and **text boards (B)**. All of them are **placeholders for now**; the owner will replace them later with real files.
- At the far end there are two exits. The visitor must choose one:
  - **Exit 1** → "right path" ending.
  - **Exit 2** → "wrong path" ending (falling into hell animation) with a "do you want another chance?" option.

The result must feel polished, romantic-playful and smooth on **desktop and mobile**.

---

## 2. Blueprint legend (decoded)

| Symbol on blueprint | Meaning | Count | IDs |
|---|---|---|---|
| **P** | Photo frame → placeholder image now, real photo later | 8 | P1 … P8 |
| **V** | Video screen → placeholder video now, real video later | 2 | V1, V2 |
| **B** | Board with a text → one dummy line now, editable later | 5 | B1 … B5 |
| **Large Pillar** | Big block in the middle of the main hall; 3 faces carry photos | 1 | — |
| **bench** (two arrows) | Two seating benches next to the pillar | 2 | Bench A, Bench B |
| **Exit 1 / Exit 2** | Two corridors leaving the top alcove, left and right | 2 | — |
| **Entry** (arrow up) | Where the visitor starts | 1 | — |
| **"Name"** (bottom face of pillar, hard to read) | Museum title plaque facing the entry | 1 | T1 |

### Interpretation notes (handwriting was ambiguous — these are the decisions taken)
- Pillar faces: **P1 = east**, **P2 = north** (bench A in front), **P3 = west** (bench B in front), **T1 = south** (title plaque, faces Entry).
- **P4 / P5** face each other on the two side walls of the **left alcove**; **P6 / P7** do the same in the **right alcove**; **P8** is on the hall's north wall (east half).
- **V2** is on the hall's north wall (west half); **V1** is on the back wall of the top "Decision Alcove".
- **B1 / B2** are on the hall's west wall (north / south); **B3** on the hall's east wall; **B4 / B5** on the west / east side walls of the Decision Alcove, next to the exit doors.
- The exit texts are large **door signs (S1, S2)** above the two exit doors — separate from B4/B5.

Exact coordinates for every item are in `Architecture.md §3`.

---

## 3. Characters

| | **Jenil** | **Rutu** |
|---|---|---|
| Gender | Male | Female |
| Look (stylised low-poly, built from primitives) | Short dark hair, navy jacket, dark jeans, sneakers | Long dark hair (ponytail), rose/maroon top, light skirt or dress, shoes |
| Name tag | Floating label "Jenil" | Floating label "Rutu" |

Rules:
- **Character select screen** after loading: two cards (Jenil / Rutu) with rotating 3D previews. The visitor picks one. A `defaultCharacter` option exists in `content.json` (`"rutu"` by default, because the museum is a gift for her).
- The chosen character is the **player**. The other one is a **companion** that follows 1.8 m behind (smooth, collision-safe, teleports next to the player if it falls > 12 m behind).
- Models are built procedurally (capsules, spheres, boxes) with a procedural **idle / walk / run** animation. If `public/assets/characters/jenil.glb` or `rutu.glb` exists, load it instead (same animation hooks: scale to 1.75 m / 1.65 m tall; if the GLB has clips named `Idle`, `Walk`, `Run`, use them).
- Movement must be **perfect**: no sliding on the spot, no jitter, no clipping through walls, no getting stuck in corners, character always faces the direction of travel. Exact numbers in `Architecture.md §6`.

---

## 4. Controls

| Action | Desktop | Mobile |
|---|---|---|
| Move | `W A S D` or arrow keys | Left on-screen joystick |
| Run | Hold `Shift` | Push joystick to the edge |
| Look / orbit camera | Drag with mouse (left or right button) | Drag on the right half of the screen |
| Interact | `E` (or click the prompt) | Tap the on-screen "Interact" button |
| Close viewer | `Esc` / click outside | Tap ✕ |
| Mute / unmute music | `M` or speaker button | Speaker button |
| Map | `Tab` toggles big minimap | Tap the minimap |

No pointer lock (the visitor must be able to use the mouse for UI at all times).

---

## 5. Content rules (placeholders now, real files later)

### 5.1 Photos (P1 … P8)
- Each slot shows a **placeholder image** that clearly says its ID, e.g. a soft gradient with the text `P3 — replace me`. Generate them as `public/assets/photos/P1.svg … P8.svg` using a Node script (`scripts/make-placeholders.mjs`, no dependencies).
- Frame style: wooden frame, white matte, small brass plaque with the caption, a warm spotlight above.
- The frame **auto-fits the aspect ratio** of whatever image is loaded (max box per slot is in `Architecture.md §3.3`), so real photos are never stretched or cropped.
- Interact (`E`) opens a **lightbox** with the big image and caption.

### 5.2 Videos (V1, V2)
- Each slot is a cinema-style screen (16:9, dark bezel).
- Placeholder = an **animated canvas texture** reading `V1 — video placeholder ▶` (no binary file needed).
- If `public/assets/videos/V1.mp4` (or `.webm`) exists, it is used automatically.
- Behaviour: auto-play **muted, looped** when the player is within 7 m and the screen is on-camera; pause otherwise (saves performance). `E` opens a larger viewer **with sound** and a close button.
- Use `playsinline`, never autoplay with sound, handle the browser autoplay policy gracefully.

### 5.3 Boards (B1 … B5)
- Wood/chalkboard style plaque with **one line of dummy text**, rendered through a canvas texture. Default text: `Dummy text for B1 - edit me later.` (…B2, B3, B4, B5).
- Interact opens a small card with the same text (so long texts stay readable later).

### 5.4 Drop-in replacement (very important for the owner)
The owner must be able to replace media **without touching code**:

```
public/
  assets/
    photos/      ← P1.jpg … P8.jpg   (also .jpeg .png .webp)  — overrides the P?.svg placeholder
    videos/      ← V1.mp4, V2.mp4    (also .webm), optional V1.jpg poster
    audio/       ← bgm.mp3           (optional background music)
    characters/  ← jenil.glb, rutu.glb (optional)
  content/
    content.json ← all texts, captions, titles
```

Resolution order for photo slot `Pn`: `Pn.jpg → Pn.jpeg → Pn.png → Pn.webp → Pn.svg (placeholder)`. For videos: `Vn.mp4 → Vn.webm → animated placeholder`. A missing file must never crash the app or log an error beyond a single `console.info`.

Create `public/assets/README.txt` (plain language, 10 lines) explaining the above.

---

## 6. Exits and endings (exact behaviour)

### 6.1 Texts (stored in `content.json`; keep an `originalText` field with the owner's raw wording)

| Key | Text shown |
|---|---|
| Exit 1 door sign (S1) | `Do you want to go out with me for a ride!` |
| Exit 2 door sign (S2) | `No, I will not come with you!` |
| Right-path popup | `Congratulations! You chose the right path.` |
| Wrong-path text | `Sorry, you chose the wrong exit.` |
| Retry question | `Do you need another chance?` |
| Retry buttons | `Yes, give me another chance` / `No` |
| After "No" | `Okay... the museum will be here whenever you change your mind.` + button `Actually, let me try again` |

(The owner's raw wording was: "Congraculation you choose right path", "sorry you choose the wrong exit", "no i will not coming with you!", "do you need the another chance ?". Spelling/grammar was lightly corrected; meaning unchanged. Store the raw versions in `originalText`.)

### 6.2 Exit 1 — right path
1. Player walks to the end of the Exit 1 corridor (glowing door) → input locks.
2. **Screen fades to black** (0.8 s).
3. On black, a **popup card** appears with the right-path text. (SHOULD: soft confetti + floating hearts behind it.)
4. Button: `Replay the museum` → fade to black → respawn at Entry → fade in.

### 6.3 Exit 2 — wrong path
1. Player reaches the end of the Exit 2 corridor → input locks.
2. **Screen fades to black** (0.8 s).
3. **Falling-into-hell animation** (cartoon style, not gory): the player's character tumbles down a glowing lava shaft with rising embers, flickering orange light, red fog, camera shake, a fiery glow growing below. Full spec in `Architecture.md §8.2`.
4. After ~3 s the text `Sorry, you chose the wrong exit.` fades in.
5. After ~6 s the panel appears: **"Do you need another chance?"** with two buttons:
   - **Yes** → fade to black → respawn at Entry (progress counter kept) → fade in → walking works again. Must work **unlimited times**.
   - **No** → farewell text + `Actually, let me try again` button (which behaves like Yes).

---

## 7. Things that make the museum more attractive

Priority tiers. **Implement every MUST and SHOULD completely. Do NOT start NICE items until all tests are green.**

**MUST**
- Warm gallery lighting: spotlight above every P/V/B, soft shadows from the skylight and a few key lights, ACES tone mapping.
- Polished wooden floor (procedural parquet), plastered walls with skirting boards and crown moulding, ceiling with beams.
- Skylight above the pillar with a visible light shaft and drifting dust motes.
- Pillar styled like a marble monument with a glowing title plaque `T1` facing the Entry (text from `content.json`, default `Jenil & Rutu — Our Museum`).
- Two benches, potted plants in corners, rope stanchions near the pillar.
- Loading screen with a progress bar; character-select screen.
- HUD: minimap (top-down, built from the layout, shows player dot + direction), "Memories found X/15" counter (8 photos + 2 videos + 5 boards), control hints, mute button.
- Interaction prompt ("Press E" / "Tap") that appears within 2.8 m of an item while roughly facing it.
- Fade transitions between every major state.

**SHOULD**
- Background music (`assets/audio/bgm.mp3` if present; otherwise a soft procedural ambient pad via WebAudio) starting after the first click, with mute. Footstep sounds (procedural).
- Intro fly-through (≈6 s, skippable) from the foyer over the hall.
- Floating hearts / petals drifting slowly around the pillar.
- Exit doors glowing: Exit 1 warm gold, Exit 2 cool blue (keep it neutral — don't hint which is "right").
- Subtle bloom (disabled on mobile / low FPS), auto quality scaling (pixel ratio 1–2).
- Mobile controls (joystick, interact button), landscape + portrait support.
- Credit line in the foyer floor text / small plaque: `Made with love by Jenil` (editable).

**NICE (only after everything else is green)**
- Characters sit on benches with `E`.
- Footprint decals, wall-mounted spotlight cones with additive glow.
- Photo-viewed "sparkle" effect, achievements toast at 15/15.

---

## 8. Required project structure (generate exactly this)

```
jenil-rutu-museum/
├─ INSTRUCTION.md  TechStack.md  Architecture.md      ← provided (keep them)
├─ reference/blueprint.jpg                            ← provided (keep it)
├─ README.md                  ← run, edit content, replace media, redeploy (≤ 1 page)
├─ package.json  vite.config.ts  tsconfig.json  playwright.config.ts  vitest.config.ts
├─ index.html
├─ public/
│  ├─ assets/{photos,videos,audio,characters}/  + README.txt
│  └─ content/content.json
├─ scripts/make-placeholders.mjs
├─ src/ … (see Architecture.md §2)
├─ tests/
│  ├─ unit/*.test.ts
│  └─ e2e/*.spec.ts
└─ docs/verification/         ← screenshots + test report + live-link smoke result
```

---

## 9. Milestones (build in this order; run build + tests after each)

| # | Milestone | Done when |
|---|---|---|
| M1 | Scaffold + world | Vite/TS project builds; `layout.ts` is the single source of truth; floor/walls/ceiling/pillar/benches generated from it; colliders generated from it; unit tests U-01…U-05 green |
| M2 | Characters + movement | Select screen; both characters; controller + camera + companion; U-06, U-10, E-02…E-05 green |
| M3 | Content + UI | Media pipeline; frames/screens/boards; interaction + viewers; HUD; audio; U-07, U-09, E-06, E-07 green |
| M4 | Endings | Exit triggers, fades, right path, hell animation, retry flow; U-08, E-08, E-09 green |
| M5 | Polish + mobile | All MUST/SHOULD extras; mobile controls; E-10…E-12 green |
| M6 | QA + ship | Full test run green, README, deploy, live smoke test E-13, final report |

---

## 10. Testing requirements (mandatory — do not skip, disable or weaken any test)

Create a debug API exposed on `window.__MUSEUM__` when the URL has `?test=1` (spec in `Architecture.md §9`). Tests drive the game through the **same input pipeline as real keys/touch** wherever movement is tested.

### Unit tests (Vitest)
| ID | What it proves |
|---|---|
| U-01 | Every slot (P1–P8, V1–V2, B1–B5, T1, S1–S2) exists exactly once with the right type |
| U-02 | Each wall slot sits on a real wall face: walkable space in front, solid behind, frame fully inside the wall (not over a door opening or corner) |
| U-03 | Spawn point, every stand-off point (slot + 1.5 m along its normal) and both exit triggers are reachable/walkable for a circle of r = 0.35 m |
| U-04 | Collision: from 360 headings (1° steps) a walking circle can never enter walls, pillar or benches, and it slides along walls (tangential motion ≠ 0) |
| U-05 | No tunnelling: with dt = 0.25 s at run speed against every wall, the player stays outside |
| U-06 | Speeds (walk 3.0 m/s, run 5.5 m/s, ±2 %), diagonal not faster, camera-relative mapping correct for yaw 0/90/180/270 |
| U-07 | Media resolver: jpg beats svg, falls back to placeholder, unknown/missing files never throw |
| U-08 | State machine: all legal transitions pass, illegal ones are rejected; Exit1 → RIGHT_PATH; Exit2 → WRONG_PATH → yes → EXPLORING at spawn; no → FAREWELL → try again → EXPLORING |
| U-09 | `content.json` validates: every slot has an entry, strings non-empty, board lines ≤ 80 chars |
| U-10 | Companion: stays 1.2–3 m from the player, never inside colliders, teleports if > 12 m |

### End-to-end tests (Playwright, Chromium with software WebGL; desktop 1280×720 and mobile 390×844)
| ID | What it proves |
|---|---|
| E-01 | Boots with no console errors / uncaught exceptions / 404s; WebGL canvas present |
| E-02 | Select screen shows "Jenil" and "Rutu"; each choice starts the game with the right name tag; companion is the other character |
| E-03 | W/A/S/D and arrow keys move in the expected directions; Shift is faster; stops ≤ 0.3 s after release; facing error < 10° after 0.5 s |
| E-04 | Mouse-drag orbit works; camera is never inside walls/ceiling at 10 stress positions (corners, corridors, alcoves); distance 1.0–5.0 m |
| E-05 | **Full walk**: using real inputs, the player walks from the Entry to every stand-off point and both exits; never stuck > 1.5 s; never leaves the walkable area |
| E-06 | At each stand-off point the correct prompt appears; interaction opens the right viewer (photo lightbox, video viewer with play state, board card); `Esc` closes; counter reaches 15/15 |
| E-07 | Drop-in replacement: a generated `P1.png` placed in `public/assets/photos` is used instead of the SVG (checked via `getSlotInfo`), then removed |
| E-08 | Exit 1: black screen (screenshot luminance ≈ 0) → right-path text visible → Replay returns to the Entry and controls work |
| E-09 | Exit 2: black → hell animation (state `HELL_FALL`, camera Y decreasing, particles > 0) → wrong-exit text → retry panel; **Yes** twice in a row works; **No** → farewell → try again works |
| E-10 | Mobile: joystick moves the character, interact button works, nothing overflows, tap targets ≥ 44 px, both endings work with taps |
| E-11 | Resize / orientation change: no crash, canvas fills viewport |
| E-12 | Perf smoke: record FPS, draw calls, triangles; assert draw calls < 400 and triangles < 600 000 (FPS reported, not asserted) |
| E-13 | **Same smoke suite against the LIVE URL** (E-01, E-02, short E-05, E-08, E-09) |

`npm run test:all` must run typecheck + unit + e2e and exit 0. Save the HTML/JSON report and screenshots to `docs/verification/`.

Also verify visually with your browser tool and save screenshots: entry foyer, main hall (wide), each alcove, Decision Alcove, both corridors, a photo lightbox, a video viewer, both ending screens, mobile portrait.

---

## 11. Deployment and live link

1. `vite.config.ts` must use `base: './'` so the site works from any path.
2. Deploy the static `dist/` folder. Preference order: **Vercel** (`npx vercel --prod --yes`) → **Netlify** (`npx netlify deploy --prod --dir=dist`) → **GitHub Pages** (`gh-pages` branch).
3. If no deployment account is logged in, **stop at that step**, finish everything else, and tell me the single exact login/command I need to run. **Never invent or guess a URL.**
4. After deploying, open the live URL with the browser tool, run `E-13`, save screenshots to `docs/verification/live-*.png`.
5. Add `npm run deploy` so the owner can redeploy after replacing images (document in README).

---

## 12. Definition of Done (all must be true)

- [ ] Every blueprint element exists at its position: Entry, pillar, 2 benches, 8 P, 2 V, 5 B, T1, S1, S2, 2 exits.
- [ ] Both characters selectable; companion follows; movement/camera smooth and collision-perfect.
- [ ] Placeholders everywhere; drop-in replacement works with no code change.
- [ ] Exit 1 and Exit 2 flows exactly as §6; retry works unlimited times.
- [ ] All MUST + SHOULD extras done; works on desktop and mobile.
- [ ] `npm run test:all` green; E-13 green on the live URL.
- [ ] README written; folder structure as §8.
- [ ] Final report delivered (format below).

### Final report format (last message)
1. One-paragraph summary.
2. Table of tests U-01…U-10, E-01…E-13 with PASS/FAIL.
3. Any blueprint/spec conflicts or assumptions.
4. How to replace media + redeploy (3 lines).
5. Last line exactly: `LIVE LINK: <url>` (or `LIVE LINK: NOT DEPLOYED — <exact step I must do>`).

---

## 13. Working rules for the agent

- Work autonomously; ask me only if you are blocked by authentication or a missing file.
- Start in Planning mode: produce an implementation plan and task list, then execute milestone by milestone.
- Keep `layout.ts` as the single source of truth for visuals, colliders, minimap and tests.
- Do not rename slot IDs or file names. Do not hard-code texts outside `content.json` (except UI chrome).
- No backend, no API keys, no copyrighted assets, no runtime CDN dependencies (bundle everything; system font stack).
- If a test fails, fix the cause. Never delete, skip or loosen a test to make it pass.
- Keep the code readable: small modules, comments where behaviour is non-obvious.

# Architecture.md — Jenil & Rutu 3D Museum

## 1. System overview

```
                         ┌────────────────────────────┐
  content.json ─────────►│  ContentStore (validated)  │
  assets/*  ──► MediaResolver ─► textures / video      │
                         └──────────────┬─────────────┘
                                        │
 layout.ts  (single source of truth) ───┼───────────────┐
   rooms, obstacles, slots, triggers    │               │
        │                               │               │
        ├─► WorldBuilder ──► Three.js scene meshes      │
        ├─► Colliders  ──► CollisionWorld (2D)          │
        ├─► Minimap                                      │
        └─► Unit tests                                   │
                                                         ▼
 Input (keys/mouse/touch) ─► InputMapper ─► PlayerController ─► Camera rig
                                                         │            │
                                   Companion (follows) ◄─┤            │
                                                         ▼            ▼
                         GameStateMachine ◄──── Triggers / Interaction
                                │
        ┌───────────────────────┼─────────────────────────┐
        ▼                       ▼                         ▼
   UI layer (DOM)         EndingController         Audio manager
 (select, HUD, viewers)  (fade, right, hell)
```

## 2. Source layout

```
src/
├─ main.ts                    boot, loop, wiring
├─ core/
│  ├─ stateMachine.ts         GameState + transitions
│  ├─ clock.ts                fixed-step loop, time scale
│  ├─ events.ts               tiny typed event bus
│  └─ debugApi.ts             window.__MUSEUM__ (only with ?test=1)
├─ config/
│  ├─ layout.ts               rooms, obstacles, slots, triggers, spawn  (§3)
│  ├─ settings.ts             speeds, radii, camera, timings           (§6, §7)
│  └─ content.ts              loads + validates public/content/content.json
├─ world/
│  ├─ worldBuilder.ts         floor/walls/ceiling/props from layout
│  ├─ wallsFromRooms.ts       boundary tracing of the room union → wall segments
│  ├─ materials.ts            procedural textures
│  ├─ lighting.ts             lights, skylight shaft, dust, hearts
│  ├─ frames.ts               photo frames, video screens, boards, signs
│  └─ props.ts                benches, plants, stanchions, pillar, doors
├─ physics/
│  ├─ collisionWorld.ts       circle vs wall segments + AABBs
│  └─ raycastCamera.ts        camera wall avoidance
├─ characters/
│  ├─ characterFactory.ts     procedural Jenil & Rutu (+ GLB override)
│  ├─ animator.ts             idle/walk/run procedural animation
│  ├─ playerController.ts
│  └─ companion.ts
├─ media/
│  ├─ mediaResolver.ts        extension fallback chain
│  ├─ placeholderTextures.ts  canvas placeholders (video, missing files)
│  └─ videoManager.ts         proximity play/pause, viewer sound
├─ ui/
│  ├─ loading.ts  characterSelect.ts  hud.ts  minimap.ts
│  ├─ viewers.ts  (lightbox, video viewer, board card)
│  ├─ joystick.ts  prompts.ts  endingScreens.ts
│  └─ styles.css
├─ endings/
│  ├─ endingController.ts     fade + sequencing
│  ├─ rightPath.ts
│  └─ hellScene.ts            separate Three.js scene (§8.2)
└─ audio/audioManager.ts
```

## 3. Layout specification (authoritative)

### 3.1 Coordinate system
- **Plan coordinates** `(x, y)` in **metres**: `+x` = east/right on the blueprint, `+y` = north/up on the blueprint (towards the exits). Origin = centre of the pillar.
- **Three.js mapping**: world position = `(x, height, -y)`. So north (`+y`) is `-z`, and the default camera looks towards `-z` at spawn.
- **Yaw convention**: yaw 0° = facing north (+y); positive yaw turns clockwise seen from above (towards east).
- Ceiling height `H = 4.5 m` everywhere. Wall thickness 0.3 m (extends *outwards* from the walkable boundary; the walkable boundary is the exact collision edge).
- All room corners are integers, so walls can be derived exactly on a 1 m grid (see `wallsFromRooms.ts`).

### 3.2 Rooms (axis-aligned rectangles; walkable area = **union** of them)

| ID | Name | x range | y range | Notes |
|---|---|---|---|---|
| R1 | Entry Foyer | [-4, 4] | [-13, -7] | Spawn here, 8 m opening to the hall at y = -7 |
| R2 | Main Hall | [-10, 10] | [-7, 9] | Large pillar in the middle |
| R3 | Left Alcove | [-16, -10] | [-2, 2] | 4 m opening in the hall's west wall |
| R4 | Right Alcove | [10, 16] | [1, 5] | 4 m opening in the hall's east wall |
| R5 | Decision Alcove | [-3, 3] | [9, 15] | 6 m opening in the hall's north wall |
| R6 | Exit-1 Corridor | [-9, -3] | [11, 14] | 3 m wide, opens from R5's west wall |
| R7 | Exit-2 Corridor | [3, 9] | [11, 14] | 3 m wide, opens from R5's east wall |

Walls = every edge between a walkable 1 m cell and a non-walkable cell. Door openings therefore appear automatically where rooms touch. Add door frames (visual only) at R6/R5 and R7/R5 openings, and an archway at the foyer/hall opening.

### 3.3 Obstacles (solid, not walkable)

| ID | Shape (plan AABB) | Notes |
|---|---|---|
| Pillar | x [-3, 3], y [-2.5, 2.5], height to ceiling (skylight above) | Faces: E = P1, N = P2, W = P3, S = T1 |
| Bench A | x [0.5, 3.5], y [4.6, 5.2] | Faces south, towards P2 |
| Bench B | x [-5.9, -5.3], y [-1.5, 1.5] | Faces east, towards P3 |
| Plants (4) | circle r = 0.4 at (-9, 8), (9, 8), (-9, -6), (9, -6) | Collide as circles |
| Stanchion posts | purely visual, around the pillar at 1 m distance, *no collision* (rope is decorative) | |

### 3.4 Slots (wall-mounted items)

`pos` = centre of the item on the wall surface, `n` = outward normal (direction the item faces), `elev` = height of item centre above floor, `box` = max width × height in metres. Items sit 0.03 m in front of the wall.

| ID | Type | Wall / location | pos (x, y) | n | elev | box (w × h) |
|---|---|---|---|---|---|---|
| P1 | photo | Pillar east face | (3, 0) | (+1, 0) | 1.7 | 1.6 × 1.2 |
| P2 | photo | Pillar north face | (0, 2.5) | (0, +1) | 1.7 | 1.6 × 1.2 |
| P3 | photo | Pillar west face | (-3, 0) | (-1, 0) | 1.7 | 1.6 × 1.2 |
| T1 | title plaque | Pillar south face | (0, -2.5) | (0, -1) | 2.2 | 3.0 × 0.9 |
| P4 | photo | Left alcove, north wall | (-13, 2) | (0, -1) | 1.7 | 1.6 × 1.2 |
| P5 | photo | Left alcove, south wall | (-13, -2) | (0, +1) | 1.7 | 1.6 × 1.2 |
| P6 | photo | Right alcove, north wall | (13, 5) | (0, -1) | 1.7 | 1.6 × 1.2 |
| P7 | photo | Right alcove, south wall | (13, 1) | (0, +1) | 1.7 | 1.6 × 1.2 |
| P8 | photo | Hall north wall, east half | (6.5, 9) | (0, -1) | 1.7 | 1.6 × 1.2 |
| V1 | video | Decision alcove back wall | (0, 15) | (0, -1) | 2.1 | 2.4 × 1.35 |
| V2 | video | Hall north wall, west half | (-6.5, 9) | (0, -1) | 2.1 | 2.4 × 1.35 |
| B1 | board | Hall west wall, north part | (-10, 6) | (+1, 0) | 1.9 | 2.0 × 0.9 |
| B2 | board | Hall west wall, south part | (-10, -4.5) | (+1, 0) | 1.9 | 2.0 × 0.9 |
| B3 | board | Hall east wall, south part | (10, -3.5) | (-1, 0) | 1.9 | 2.0 × 0.9 |
| B4 | board | Decision alcove west wall (south part) | (-3, 10) | (+1, 0) | 1.9 | 1.6 × 0.9 |
| B5 | board | Decision alcove east wall (south part) | (3, 10) | (-1, 0) | 1.9 | 1.6 × 0.9 |
| S1 | exit sign | Above Exit-1 doorway (alcove west wall) | (-3, 12.5) | (+1, 0) | 3.4 | 3.0 × 0.7 |
| S2 | exit sign | Above Exit-2 doorway (alcove east wall) | (3, 12.5) | (-1, 0) | 3.4 | 3.0 × 0.7 |

**Stand-off point** of a slot = `pos + 1.5 · n` (used by tests and by the minimap "locate" feature). All stand-off points are guaranteed walkable (verified).

Exit doorways: openings 3 m wide, 2.8 m high, centred on y = 12.5. S1/S2 text may wrap onto two lines.

### 3.5 Spawn, companion spawn, triggers

| Item | Value |
|---|---|
| Player spawn | (-0.8, -12), yaw 0° (facing north) |
| Companion spawn | (0.8, -12.3) |
| Exit 1 trigger | rectangle x [-9, -8.4], y [11, 14] (end of Exit-1 corridor; glowing door plane at x = -9) |
| Exit 2 trigger | rectangle x [8.4, 9], y [11, 14] |
| Interaction radius | 2.8 m, and the slot must be within ±70° of the player's facing (or the camera's) direction |

### 3.6 Reference route used by the E2E tests (verified collision-free)

`(-0.8,-12) → (-0.8,-5.5) → (-7,-5.5) → (-7,7) → (0,7) → (0,12.5) → (-8.6,12.5)` reaches **Exit 1**.
`(0,12.5) → (8.6,12.5)` instead of the last leg reaches **Exit 2**.

### 3.7 Schematic plan (not to scale — the tables above are authoritative)

```
                          [V1]
                  +--------------------+
   EXIT 1 <-- S1  | B4              B5 |  S2 --> EXIT 2          y 9..15
              +---+                    +---+     (corridors y 11..14)
   [V2]       open 6 m                                [P8]
  +-----------+  +--------------------------+--------------+
  | B1                                                      |   y 5
  |                   [bench A]                     +-------+ P6
  |                  +----[P2]----+                 | right alcove
  +--+               |            |  [P1]           +-------+ P7  y 1
 P4  |  [bench B] [P3]   PILLAR   |
 left|              |   (T1 south)|                          B3
 alc +--+           +-------------+                           |
 P5  |  |                                                     |
  +--+  +-------------+                       +--------------+  y -7
  B2                  |     Entry Foyer       |
                      |      (spawn)          |
                      +-----------------------+                 y -13
                              ▲ ENTRY
```

## 4. Game state machine

```
BOOT → LOADING → CHARACTER_SELECT → INTRO (skippable) → EXPLORING
EXPLORING ⇄ VIEWING_MEDIA                         (movement paused while viewing)
EXPLORING → EXIT1_FADE → RIGHT_PATH → (Replay) → RESPAWN → EXPLORING
EXPLORING → EXIT2_FADE → HELL_FALL → WRONG_PATH_PROMPT
WRONG_PATH_PROMPT → (Yes) → RESPAWN → EXPLORING
WRONG_PATH_PROMPT → (No)  → FAREWELL → (Try again) → RESPAWN → EXPLORING
```
- `RESPAWN` = fade to black (0.6 s) → reset player/companion/camera to spawn, clear input, dispose Hell scene → fade in (0.8 s). Progress counter is **kept**.
- Illegal transitions throw in dev and are ignored (with `console.warn`) in prod. Unit-tested (U-08).
- While in any state other than `EXPLORING`, movement input is zeroed.

## 5. Data: `public/content/content.json` (schema)

```json
{
  "meta": { "title": "Our Museum", "plaque": "Jenil & Rutu — Our Museum", "credit": "Made with love by Jenil",
            "defaultCharacter": "rutu" },
  "photos": { "P1": { "caption": "Placeholder caption for P1" }, "...": {} },
  "videos": { "V1": { "caption": "Placeholder video V1" }, "V2": { "caption": "Placeholder video V2" } },
  "boards": { "B1": "Dummy text for B1 - edit me later.", "...": "" },
  "exits": {
    "exit1": { "signText": "Do you want to go out with me for a ride!",
               "originalText": "Do you want to go out with me for a ride!",
               "resultText": "Congratulations! You chose the right path.",
               "originalResultText": "Congraculation you choose right path" },
    "exit2": { "signText": "No, I will not come with you!",
               "originalText": "no i will not coming with you!",
               "resultText": "Sorry, you chose the wrong exit.",
               "originalResultText": "sorry you choose the wrong exit",
               "retryQuestion": "Do you need another chance?",
               "yesLabel": "Yes, give me another chance", "noLabel": "No",
               "farewellText": "Okay... the museum will be here whenever you change your mind.",
               "tryAgainLabel": "Actually, let me try again" }
  },
  "ui": { "replayLabel": "Replay the museum" }
}
```
The loader validates this (U-09). Missing keys fall back to the defaults above (with `console.warn`), never crash.

## 6. Character controller (exact numbers)

| Parameter | Value |
|---|---|
| Collision radius | 0.35 m (circle) |
| Walk speed | 3.0 m/s |
| Run speed (Shift / joystick edge) | 5.5 m/s |
| Acceleration / deceleration | 20 / 30 m/s² (stops ≤ 0.3 s after release) |
| Input mapping | Camera-relative: `W` moves along the camera's horizontal forward vector; diagonals normalised |
| Turning | Character yaw eases toward velocity direction at 12 rad/s; no spinning when idle |
| Collision response | Move in sub-steps ≤ 0.1 m; resolve circle vs wall segments and obstacle AABBs (inflated by radius); **slide** along surfaces (remove only the normal component) |
| Corner handling | Resolve up to 4 iterations per sub-step; never let the circle end inside a collider |
| Animation | Idle breathing 0.5 Hz; walk cycle stride frequency ∝ speed; legs ±35° (walk) / ±50° (run); arms ±25° / ±40°; foot-planting without sliding when stopped |
| Height | Jenil 1.75 m, Rutu 1.65 m |
| Name tag | Sprite above head, always faces camera, readable at 8 m, hides beyond 12 m |

### Companion
Follows at 1.8 m behind (target point = player − forward · 1.8, offset sideways by 0.6 m to avoid sitting directly behind the camera view). Max speed = player's speed × 1.05, same collision, smooth turn, idles when within 1.2 m, teleports beside the player if farther than 12 m.

## 7. Camera rig

| Parameter | Value |
|---|---|
| Mode | Third-person orbit around the player's chest (target height 1.4 m) |
| Default distance / pitch | 4.2 m / 20° |
| Pitch limits | −10° … +60° |
| Orbit | Mouse drag / touch drag (sensitivity 0.0035 rad/px); optional edge-less (no pointer lock) |
| Follow damping | Exponential, factor 8 (frame-rate independent) |
| Wall avoidance | Raycast from target to desired position against walls/ceiling/obstacles; place camera at `hit − 0.3 m`; min distance 0.8 m; smooth in, instant out |
| Player fade | If camera distance < 1.5 m, fade the player material opacity to 0.35 |
| FOV | 60° desktop; 70° portrait mobile |
| Near / far | 0.05 / 120 |

## 8. Rendering, lighting, endings

### 8.1 Museum rendering
- `WebGLRenderer({antialias:true})`, `outputColorSpace = SRGB`, `toneMapping = ACESFilmic`, exposure 1.0, pixel ratio `min(devicePixelRatio, 2)`.
- Environment: `RoomEnvironment` via PMREM for soft reflections on the floor; floor roughness 0.35.
- Lights (≤ 8 real): 1 hemisphere (warm/cool), 1 directional "skylight" over the pillar (casts shadows, 2048 map), 1 shadow-casting key spot in the hall, ~4 point lights across alcoves/corridors. Per-item spotlights are **faked**: an additive light-cone mesh + a soft glow quad above each frame (no real light per frame).
- Skylight: ceiling hole above the pillar, light-shaft mesh (additive, low opacity), dust motes (`Points`, 200).
- Static meshes are merged by material to keep draw calls < 400.
- Exit doors: emissive door plane at the corridor end — Exit 1 warm gold, Exit 2 cool blue; the door glow pulses gently.

### 8.2 Ending sequences (timeline)

**Exit 1 (right path)**
| t (s) | Event |
|---|---|
| 0.0 | Trigger; state `EXIT1_FADE`; input locked; character stops |
| 0.0–0.8 | CSS overlay fades to opaque black |
| 0.8–1.2 | Hold black |
| 1.2 | State `RIGHT_PATH`; popup card scales/fades in with `resultText` (+ confetti/hearts canvas behind, SHOULD) |
| any time | Button `Replay the museum` → `RESPAWN` |

**Exit 2 (wrong path, falling into hell)**
| t (s) | Event |
|---|---|
| 0.0 | Trigger; state `EXIT2_FADE`; input locked |
| 0.0–0.8 | Fade to black |
| 0.8–1.0 | Hold black; switch renderer to `HellScene`, state `HELL_FALL` |
| 1.0–1.6 | Fade in from black to the red-lit shaft |
| 1.6–∞ | Fall loop: the selected character (own model) tumbles in the centre; velocity eases 0 → 28 m/s over 3 s |
| 3.0 | `resultText` fades in (large, centred, with slight shake) |
| 6.0 | Retry panel appears: `retryQuestion` + buttons `yesLabel` / `noLabel` (fall continues behind) |
| Yes | Fade to black 0.6 s → dispose HellScene → `RESPAWN` |
| No | Panel switches to `farewellText` + `tryAgainLabel` (same effect as Yes) |

**HellScene spec** (separate `THREE.Scene` + camera; cartoon style, no gore, no skulls/faces):
- Vertical shaft: open-ended cylinder, radius 6 m, height 300 m, inside faces, emissive lava-rock canvas texture scrolling upward at the fall speed; dark red fog (`0x2a0500`, density ramps up).
- Camera above the character looking down; camera shake amplitude 0.05 → 0.15 m; slow roll.
- Character: selected model, tumbling (rotation X/Z), limbs flailing (reuse animator with a "fall" pose).
- 600 ember particles (`Points`, additive) streaming upward past the camera; 40 flame sprites along the walls.
- 3 flickering orange point lights moving with the character; a huge glowing orange disc far below that grows over time.
- Red vignette overlay that pulses; optional low-pass "whoosh" via WebAudio (stops on retry).
- Dispose all geometries/materials/textures on exit (E-09 checks memory growth).

## 9. Debug / test API (`?test=1` only)

```ts
window.__MUSEUM__ = {
  version: string,
  getState(): string,                                   // FSM state name
  getPlayer(): { x:number, y:number, yawDeg:number, speed:number, character:'jenil'|'rutu' },
  getCompanion(): { x:number, y:number },
  getCamera(): { x:number, y:number, z:number, distanceToPlayer:number, inside:boolean },
  teleport(x:number, y:number, yawDeg?:number): void,
  setVirtualKeys(k: {w?:boolean,a?:boolean,s?:boolean,d?:boolean,shift?:boolean}): void,  // same pipeline as real keys
  walkRoute(pts: [number,number][], opts?:{run?:boolean, timeoutMs?:number}):
        Promise<{ reached:boolean, stuck:boolean, trail:[number,number][] }>,   // steers with virtual keys/joystick only
  getNearbyInteractable(): string | null,               // slot id or null
  interact(): void,                                     // same as pressing E
  closeViewer(): void,
  getProgress(): { viewed:string[], total:15 },
  getSlotInfo(id:string): { kind:'file'|'placeholder', source:string },
  getStats(): { fps:number, drawCalls:number, triangles:number, memory:{geometries:number, textures:number} },
  hell: { getCameraY():number, getParticleCount():number, isActive():boolean },
  setTimeScale(n:number): void
}
```
`walkRoute` must never bypass collisions; it only presses virtual keys (steering = rotate camera yaw so that `W` points at the next waypoint, or press the right key combination).

## 10. UI layer notes
- All UI is DOM over the canvas; `pointer-events` managed so the canvas still receives drags.
- Touch: joystick left (80 px base), interact button bottom-right (≥ 56 px), camera drag on the right half; `touch-action: none` on the canvas; prevent double-tap zoom; `100dvh` layout; safe-area insets.
- Accessibility basics: buttons are real `<button>`s, focus-visible rings, `Esc` closes viewers, `prefers-reduced-motion` disables camera shake and confetti.
- Fonts: system stack only.

## 11. Error handling
- Missing optional media → silent fallback to placeholder (one `console.info`).
- WebGL unavailable → friendly full-screen message.
- Tab hidden → pause loop, pause videos/audio; resume without a time jump (clamp dt).
- Context lost → show "reload" overlay; try to restore.

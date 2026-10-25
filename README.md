# Jenil & Rutu — Our Walkable 3D Museum

A personal, fully-walkable 3D museum website built with Three.js, Vite, and TypeScript featuring customized stylized humanoid characters (Jenil & Rutu), interactive artwork and video displays, responsive camera navigation with collision avoidance, and dual narrative branching endings.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Build for production
npm run build

# 4. Preview production build locally
npm run preview
```

## Running Tests

```bash
# Run all unit tests (U-01 through U-10)
npm run test:unit

# Run full Playwright E2E suite (E-01 through E-13)
npm run test:e2e

# Run all tests (typecheck + unit + build + E2E)
npm run test:all
```

## How to Replace Photos, Videos & Text

All museum exhibits are 100% data-driven and hot-swappable with zero code changes:

- **Photos (P1–P8)**: Drop your `.jpg` or `.png` images into `public/assets/photos/` named `P1.jpg`, `P2.png`, etc.
- **Videos (V1, V2)**: Drop your `.mp4` or `.webm` files into `public/assets/videos/` named `V1.mp4`, `V2.mp4`.
- **Text & Captions**: Edit `public/assets/content.json` to update titles, labels, dates, and narrative lines.
- **Deploy**: Run `npm run build` and push/deploy your `dist/` directory.

## Controls

- **WASD / Arrow Keys**: Walk forward, back, strafe left/right.
- **Shift (Hold)**: Run.
- **Mouse Drag / Touch Drag**: Orbit camera horizontally and vertically.
- **Mouse Scroll**: Zoom camera in and out.
- **E / Screen Button**: Interact with paintings, video screens, text plaques, and exit doors.
- **M**: Mute / unmute museum audio ambiance.
- **Tab / Minimap Button**: Toggle full floor plan map.

## Architecture & License

Built in pure client-side TypeScript with Three.js (r174) and Vite 6. Zero external CDN runtime dependencies. Free for personal and educational use.

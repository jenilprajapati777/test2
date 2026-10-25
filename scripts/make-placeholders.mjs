import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const dirs = [
  path.join(rootDir, 'public', 'assets', 'photos'),
  path.join(rootDir, 'public', 'assets', 'videos'),
  path.join(rootDir, 'public', 'assets', 'audio'),
  path.join(rootDir, 'public', 'assets', 'characters'),
  path.join(rootDir, 'public', 'content'),
  path.join(rootDir, 'docs', 'verification')
];

for (const dir of dirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Generate P1.svg through P8.svg
const photoIds = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8'];
const colors = [
  ['#4a154b', '#e01e5a'],
  ['#1e3c72', '#2a5298'],
  ['#134e5e', '#71b280'],
  ['#833ab4', '#fd1d1d'],
  ['#3a1c71', '#d76d77'],
  ['#2c3e50', '#4ca1af'],
  ['#4b1248', '#f0c27b'],
  ['#240b36', '#c31432']
];

photoIds.forEach((id, index) => {
  const [c1, c2] = colors[index % colors.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}" />
      <stop offset="100%" stop-color="${c2}" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000" flood-opacity="0.4"/>
    </filter>
  </defs>
  <rect width="800" height="600" fill="url(#grad)" />
  <rect x="40" y="40" width="720" height="520" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="4" stroke-dasharray="12 8" rx="16" />
  <g filter="url(#shadow)">
    <circle cx="400" cy="240" r="64" fill="rgba(255,255,255,0.15)"/>
    <path d="M375 220 L425 220 L425 260 L375 260 Z M385 230 L395 242 L405 234 L415 250 L385 250 Z" fill="#ffffff" fill-opacity="0.9"/>
    <circle cx="390" cy="232" r="3" fill="#ffffff"/>
  </g>
  <text x="400" y="360" font-family="system-ui, -apple-system, sans-serif" font-size="52" font-weight="700" fill="#ffffff" text-anchor="middle" letter-spacing="2">${id}</text>
  <text x="400" y="415" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="400" fill="rgba(255,255,255,0.85)" text-anchor="middle">Photo Placeholder — replace me</text>
  <text x="400" y="460" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="300" fill="rgba(255,255,255,0.6)" text-anchor="middle">Drop ${id}.jpg into assets/photos to replace</text>
</svg>`;

  const outPath = path.join(rootDir, 'public', 'assets', 'photos', `${id}.svg`);
  fs.writeFileSync(outPath, svg, 'utf-8');
});

console.log('Generated placeholder photos P1-P8 successfully.');

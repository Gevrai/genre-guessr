/**
 * Build-time script: extract color palettes from YouTube thumbnails using
 * node-vibrant's Node.js pipeline (no browser CORS restrictions).
 * Outputs src/lib/palettes.json mapping youtube_id → CSSPalette | null.
 *
 * Usage: node scripts/precompute-palettes.js
 */

import { Vibrant } from 'node-vibrant/node';
import { readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SONGS_PATH = join(__dirname, '../src/data/songs.json');
const OUTPUT_PATH = join(__dirname, '../src/lib/palettes.json');

// --- Helpers (mirrors src/lib/palette.ts) ---

function hslToHex(h, s, l) {
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h * 12) % 12;
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  };
  const toHex = (x) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

function linearize(c) {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function relativeLuminance(r, g, b) {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

function contrastRatio(r1, g1, b1, r2, g2, b2) {
  const l1 = relativeLuminance(r1, g1, b1);
  const l2 = relativeLuminance(r2, g2, b2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const DEFAULTS = {
  '--bg': '#080810',
  '--bg-card': '#10101e',
  '--bg-hover': '#18182c',
  '--border': '#1c1c30',
  '--accent': '#b06ef3',
  '--accent-2': '#f06292',
  '--accent-hover': '#c490ff',
};

function boostAccentContrast(accentHex, bgCardHex) {
  const [br, bg, bb] = hexToRgb(bgCardHex);
  let hex = accentHex;
  for (let i = 0; i < 15; i++) {
    const [ar, ag, ab] = hexToRgb(hex);
    if (contrastRatio(ar, ag, ab, br, bg, bb) >= 3) return hex;
    const r = ar / 255, g = ag / 255, b = ab / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    hex = hslToHex(h, s, Math.min(l + 0.05, 0.95));
  }
  return DEFAULTS['--accent'];
}

function buildPalette(vib) {
  const { DarkVibrant: darkVibrant, DarkMuted: darkMuted, Muted: muted, Vibrant: vibrant, LightVibrant: lightVibrant } = vib;

  let bgHex = DEFAULTS['--bg'];
  if (darkVibrant) {
    const [h, s, l] = darkVibrant.hsl;
    bgHex = hslToHex(h, s, l > 0.15 ? 0.08 : l);
  }

  const bgCardHex = darkMuted ? hslToHex(...darkMuted.hsl) : DEFAULTS['--bg-card'];
  const bgHoverHex = muted ? hslToHex(...muted.hsl) : DEFAULTS['--bg-hover'];

  const borderRgba = muted
    ? (() => { const [r, g, b] = muted.rgb; return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},0.4)`; })()
    : DEFAULTS['--border'];

  let accentHex = DEFAULTS['--accent'];
  if (vibrant) {
    const [h, s, l] = vibrant.hsl;
    accentHex = boostAccentContrast(hslToHex(h, s, l), bgCardHex);
  }

  const accent2Hex = lightVibrant ? hslToHex(...lightVibrant.hsl) : DEFAULTS['--accent-2'];

  const accentHoverHex = vibrant
    ? (() => { const [h, s, l] = vibrant.hsl; return hslToHex(h, s, Math.min(l + 0.1, 0.95)); })()
    : DEFAULTS['--accent-hover'];

  return {
    '--bg': bgHex,
    '--bg-card': bgCardHex,
    '--bg-hover': bgHoverHex,
    '--border': borderRgba,
    '--accent': accentHex,
    '--accent-2': accent2Hex,
    '--accent-hover': accentHoverHex,
  };
}

// --- Main ---

async function main() {
  const songs = JSON.parse(await readFile(SONGS_PATH, 'utf-8'));
  const ids = [...new Set(songs.map((s) => s.youtube_id))];

  console.log(`Extracting palettes for ${ids.length} songs...`);

  const palettes = {};
  for (const id of ids) {
    try {
      const url = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
      const vib = await Vibrant.from(url).getPalette();
      palettes[id] = buildPalette(vib);
      console.log(`  ✓ ${id}`);
    } catch (err) {
      console.error(`  ✗ ${id}: ${err.message}`);
      palettes[id] = null;
    }
  }

  await writeFile(OUTPUT_PATH, JSON.stringify(palettes, null, 2));
  const ok = Object.values(palettes).filter(Boolean).length;
  console.log(`\nDone. ${ok}/${ids.length} palettes extracted → src/lib/palettes.json`);
}

main();

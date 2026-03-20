import precomputed from './palettes.json';

export interface CSSPalette {
  '--bg': string;
  '--bg-card': string;
  '--bg-hover': string;
  '--border': string;
  '--accent': string;
  '--accent-2': string;
  '--accent-hover': string;
}

// --- Pure utility helpers ---

/**
 * Convert HSL to a lowercase "#rrggbb" hex string.
 * h, s, l are all in 0–1 range (matches node-vibrant swatch.getHsl() output).
 */
export function hslToHex(h: number, s: number, l: number): string {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number): number => {
    const k = (n + h * 12) % 12;
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  };
  const toHex = (x: number): string =>
    Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

/**
 * Linearize an sRGB channel value (0–255) per WCAG 2.x.
 */
export function linearize(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/**
 * Compute WCAG relative luminance from RGB (0–255 each).
 */
export function relativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/**
 * Compute WCAG contrast ratio between two RGB colors (0–255 each).
 */
export function contrastRatio(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number,
): number {
  const l1 = relativeLuminance(r1, g1, b1);
  const l2 = relativeLuminance(r2, g2, b2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Serialize a CSSPalette to an inline style string.
 * Returns "" for null — :root defaults apply.
 */
export function paletteToStyle(palette: CSSPalette | null): string {
  if (!palette) return '';
  return Object.entries(palette).map(([k, v]) => `${k}: ${v}`).join('; ') + ';';
}

/**
 * Look up the pre-computed palette for a YouTube video ID.
 * Returns null if no palette was computed for this ID.
 */
export function extractPalette(youtubeId: string): CSSPalette | null {
  const data = precomputed as Record<string, CSSPalette | null>;
  return data[youtubeId] ?? null;
}

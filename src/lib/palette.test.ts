import { describe, it, expect } from 'vitest';
import { hslToHex, linearize, relativeLuminance, contrastRatio, paletteToStyle } from './palette';

describe('hslToHex', () => {
  // h, s, l are all 0–1 (matches node-vibrant swatch.getHsl() output)
  it('converts pure red (h=0, s=1, l=0.5)', () => {
    expect(hslToHex(0, 1, 0.5)).toBe('#ff0000');
  });

  it('converts pure green (h=1/3)', () => {
    expect(hslToHex(1 / 3, 1, 0.5)).toBe('#00ff00');
  });

  it('converts pure blue (h=2/3)', () => {
    expect(hslToHex(2 / 3, 1, 0.5)).toBe('#0000ff');
  });

  it('converts achromatic grey (s=0)', () => {
    expect(hslToHex(0, 0, 0.5)).toBe('#808080');
  });

  it('converts black', () => {
    expect(hslToHex(0, 0, 0)).toBe('#000000');
  });

  it('converts white', () => {
    expect(hslToHex(0, 0, 1)).toBe('#ffffff');
  });

  it('produces a very dark color for l=0.08', () => {
    const result = hslToHex(0.78, 0.6, 0.08); // dark purple
    expect(result).toMatch(/^#[0-9a-f]{6}$/);
    const r = parseInt(result.slice(1, 3), 16);
    const g = parseInt(result.slice(3, 5), 16);
    const b = parseInt(result.slice(5, 7), 16);
    expect(Math.max(r, g, b)).toBeLessThan(50);
  });
});

describe('linearize', () => {
  it('linearizes 0 to 0', () => {
    expect(linearize(0)).toBeCloseTo(0);
  });

  it('linearizes 255 to 1', () => {
    expect(linearize(255)).toBeCloseTo(1);
  });

  it('uses linear portion for low values (c=10)', () => {
    // c/255 ≈ 0.039 which is <= 0.04045, so linear: c/255/12.92
    expect(linearize(10)).toBeCloseTo((10 / 255) / 12.92, 5);
  });

  it('uses gamma portion for high values (c=200)', () => {
    const s = 200 / 255;
    expect(linearize(200)).toBeCloseTo(Math.pow((s + 0.055) / 1.055, 2.4), 5);
  });
});

describe('relativeLuminance', () => {
  it('black is 0', () => {
    expect(relativeLuminance(0, 0, 0)).toBeCloseTo(0);
  });

  it('white is 1', () => {
    expect(relativeLuminance(255, 255, 255)).toBeCloseTo(1);
  });
});

describe('contrastRatio', () => {
  it('black on white is ~21:1', () => {
    expect(contrastRatio(0, 0, 0, 255, 255, 255)).toBeCloseTo(21, 0);
  });

  it('same color is 1:1', () => {
    expect(contrastRatio(128, 128, 128, 128, 128, 128)).toBeCloseTo(1);
  });

  it('is symmetric (order of colors does not matter)', () => {
    const a = contrastRatio(100, 50, 200, 20, 20, 20);
    const b = contrastRatio(20, 20, 20, 100, 50, 200);
    expect(a).toBeCloseTo(b, 5);
  });
});

describe('paletteToStyle', () => {
  it('returns empty string for null', () => {
    expect(paletteToStyle(null)).toBe('');
  });

  it('returns CSS custom property string with all 7 variables', () => {
    const palette = {
      '--bg': '#000',
      '--bg-card': '#111',
      '--bg-hover': '#222',
      '--border': 'rgba(50,50,80,0.4)',
      '--accent': '#b06ef3',
      '--accent-2': '#f06292',
      '--accent-hover': '#c490ff',
    } as const;
    const result = paletteToStyle(palette);
    expect(result).toContain('--bg: #000');
    expect(result).toContain('--accent: #b06ef3');
    expect(result).toContain('--border: rgba(50,50,80,0.4)');
    expect(result.split(';').filter(Boolean).length).toBe(7);
    expect(result.endsWith(';')).toBe(true);
  });
});

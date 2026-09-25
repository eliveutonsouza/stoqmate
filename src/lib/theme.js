import { CATEGORY_TEMPLATES } from './category-templates';

export const TWEAK_DEFAULTS = {
  accent: '#E94B1C',
  theme: 'light',
  density: 'comfortable',
};

function hexToRgb(hex) {
  const v = (hex || '').replace('#', '');
  return [parseInt(v.substring(0, 2), 16) || 0, parseInt(v.substring(2, 4), 16) || 0, parseInt(v.substring(4, 6), 16) || 0];
}

const srgbLin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const relLum = ([r, g, b]) => 0.2126 * srgbLin(r) + 0.7152 * srgbLin(g) + 0.0722 * srgbLin(b);
const contrast = (a, b) => {
  const l1 = relLum(a), l2 = relLum(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};
const rgbStr = ([r, g, b]) => `rgb(${r}, ${g}, ${b})`;

// Nudge `rgb` toward `target` until it clears `min` contrast against EVERY backdrop
// in `against` — the constraint is the worst ground the color actually lands on.
function shiftUntilContrast(rgb, target, against, min) {
  const grounds = Array.isArray(against[0]) ? against : [against];
  const worst = (c) => Math.min(...grounds.map(g => contrast(c, g)));
  let c = rgb.slice();
  for (let i = 0; i < 60 && worst(c) < min; i++) {
    c = c.map((v, j) => Math.round(v + (target[j] - v) * 0.06));
  }
  return c;
}

export function applyTheme({ accent, theme, density }) {
  const root = document.documentElement;
  const dark = theme === 'dark';
  const base = hexToRgb(accent);
  const WHITE = [255, 255, 255], BLACK = [10, 10, 10];
  const elev = dark ? [22, 20, 16] : WHITE;
  const sunken = dark ? [10, 9, 7] : [244, 242, 238];

  root.style.setProperty('--accent', accent);

  // Button fill: darken the accent until white label copy clears 4.5:1.
  const strong = shiftUntilContrast(base, BLACK, WHITE, 4.6);
  root.style.setProperty('--accent-strong', rgbStr(strong));
  root.style.setProperty('--accent-hover', rgbStr(strong.map(c => Math.max(0, Math.round(c * 0.87)))));
  root.style.setProperty('--accent-fg', '#ffffff');

  root.style.setProperty('--accent-soft', `rgba(${base[0]}, ${base[1]}, ${base[2]}, ${dark ? 0.18 : 0.10})`);

  // Small-text variant. Chips paint this colour on the --accent-soft wash, and a
  // "current item" row often carries that wash too — so the chip sits on the wash
  // composited TWICE, which is darker than either ground alone. Solve against the
  // doubled case as well, or "Você está aqui" style chips fall short on dark.
  const softAlpha = dark ? 0.18 : 0.10;
  const wash = (ground) => base.map((c, i) => Math.round(c * softAlpha + ground[i] * (1 - softAlpha)));
  const wash2 = (ground) => wash(wash(ground));
  const text = shiftUntilContrast(base, dark ? WHITE : BLACK,
    [wash2(elev), wash2(sunken), wash(elev), wash(sunken), elev, sunken], 4.6);
  root.style.setProperty('--accent-text', rgbStr(text));

  // Category colours need two tokens, because the same hue does two jobs:
  //   --cat-X      solid fill behind WHITE initials/bars  — must stay dark
  //   --cat-X-ink  icon + legend colour ON the page background — must lighten on dark
  CATEGORY_TEMPLATES.forEach(c => {
    const rgb = hexToRgb(c.color);
    root.style.setProperty(`--cat-${c.id}`, rgbStr(shiftUntilContrast(rgb, BLACK, [WHITE], 4.6)));
    root.style.setProperty(`--cat-${c.id}-ink`, rgbStr(shiftUntilContrast(rgb, dark ? WHITE : BLACK, [elev, sunken], 3.2)));
  });

  root.setAttribute('data-theme', theme);
  root.setAttribute('data-density', density);
}

import SHOT_META from "./shots.json";
import type { HelpFocus, HelpShot } from "./types";

// Capturas reais do app (empresa demo "Bonsucesso Varejo"), geradas por
// scripts/help-media. O JSON guarda o retângulo de destaque de cada uma, medido
// no próprio DOM na hora da captura.
const META = SHOT_META as Record<string, { focus: HelpFocus | null }>;

export function shot(name: string, alt: string): HelpShot {
  const focus = META[name]?.focus ?? undefined;
  return { src: `shots/${name}.webp`, alt, ...(focus ? { focus } : {}) };
}

export function hasShot(name: string): boolean {
  return name in META;
}

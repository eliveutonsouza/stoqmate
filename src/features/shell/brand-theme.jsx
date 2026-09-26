"use client";

import * as React from 'react';
import { applyTheme, TWEAK_DEFAULTS } from '@/lib/theme';

// Cor da marca (Configurações → Branding) vira o --accent do painel da loja.
// O `data-brand` no <html> fica pro ThemeInit do layout raiz, que roda
// depois deste efeito na primeira montagem e não pode voltar pro padrão.
export function BrandTheme({ color }) {
  React.useEffect(() => {
    if (!/^#[0-9a-fA-F]{6}$/.test(color ?? '')) return undefined;
    const root = document.documentElement;
    root.dataset.brand = color;
    applyTheme({ ...TWEAK_DEFAULTS, accent: color });
    return () => {
      delete root.dataset.brand;
      applyTheme(TWEAK_DEFAULTS);
    };
  }, [color]);
  return null;
}

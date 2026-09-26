"use client";

import { useEffect } from "react";
import { applyTheme, TWEAK_DEFAULTS } from "@/lib/theme";

export function ThemeInit() {
  useEffect(() => {
    // Painel da loja com cor de marca: BrandTheme já aplicou e marcou o <html>.
    const brand = document.documentElement.dataset.brand;
    applyTheme(brand ? { ...TWEAK_DEFAULTS, accent: brand } : TWEAK_DEFAULTS);
  }, []);

  return null;
}

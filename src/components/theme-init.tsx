"use client";

import { useEffect } from "react";
import { applyTheme, TWEAK_DEFAULTS } from "@/lib/theme";

export function ThemeInit() {
  useEffect(() => {
    applyTheme(TWEAK_DEFAULTS);
  }, []);

  return null;
}

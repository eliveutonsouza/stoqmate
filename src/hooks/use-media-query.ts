"use client";

import * as React from "react";

// Só para quando a ESTRUTURA muda com a largura (ex.: moldura de celular
// vs tela cheia). Layout que só reflui fica em CSS (design-system.css).
// No servidor e na hidratação devolve false — o componente renderiza a
// versão desktop e troca no cliente.
export function useMediaQuery(query: string) {
  return React.useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

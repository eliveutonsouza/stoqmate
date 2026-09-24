"use client";

import * as React from "react";

// Escala de um objeto de tamanho fixo (preview de tela, filme do hero) pra
// caber na largura disponível: nunca maior que maxScale, menor quando o
// container encolhe. transform: scale sozinho não reduz a caixa de layout —
// por isso o chamador dimensiona a caixa com o valor devolvido aqui.
//
// Mede o ancestral [data-fit-root] (um container cuja largura não depende
// do próprio preview — numa coluna `auto` o pai imediato tem exatamente a
// largura da caixa, e a escala nunca voltaria a crescer). Sem ele, usa o pai.
export function useFitScale(ref: React.RefObject<HTMLElement | null>, designWidth: number, maxScale: number) {
  const [scale, setScale] = React.useState(maxScale);

  React.useEffect(() => {
    const el = ref.current;
    const root = el?.closest<HTMLElement>("[data-fit-root]") ?? el?.parentElement;
    if (!el || !root) return;
    const measure = () => {
      const available = root.clientWidth;
      if (available > 0) setScale(Math.min(maxScale, available / designWidth));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    return () => ro.disconnect();
  }, [ref, designWidth, maxScale]);

  return scale;
}

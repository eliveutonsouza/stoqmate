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
// `available` é a largura medida (null antes da 1ª medição), pra quem precisa
// trocar de layout além de escalar.
export function useFitScale(ref: React.RefObject<HTMLElement | null>, designWidth: number, maxScale: number) {
  const [available, setAvailable] = React.useState<number | null>(null);

  React.useEffect(() => {
    const el = ref.current;
    const root = el?.closest<HTMLElement>("[data-fit-root]") ?? el?.parentElement;
    if (!el || !root) return;
    const measure = () => {
      if (root.clientWidth > 0) setAvailable(root.clientWidth);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    return () => ro.disconnect();
  }, [ref]);

  const scale = available == null ? maxScale : Math.min(maxScale, available / designWidth);
  return { scale, available };
}

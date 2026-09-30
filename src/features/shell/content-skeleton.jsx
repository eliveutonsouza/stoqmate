"use client";

import { Page } from '@/components/ui/page-container';

// Conteúdo provisório enquanto o servidor renderiza a próxima tela: o chrome
// (sidebar + header) já aparece no clique, só a área de conteúdo espera.
export function ContentSkeleton() {
  return (
    <Page>
      <div role="status" aria-live="polite" aria-busy="true" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <span className="sr-only">Carregando…</span>
        <div className="skel" style={{ height: 28, width: 'min(320px, 60%)' }} />
        <div className="g3" style={{ gap: 12 }}>
          {[0, 1, 2].map((i) => <div key={i} className="skel" style={{ height: 84 }} />)}
        </div>
        <div className="skel" style={{ height: 320 }} />
      </div>
    </Page>
  );
}

"use client";

import { SECTION } from '@/features/landing/section';
import { StoreAvatar } from '@/components/domain/store-avatar';

export function LandingTestimonials() {
  const quotes = [
    { q: 'Vendemos de eletrônico a alimento em quatro lojas. Era uma planilha por unidade. Hoje é um catálogo só, e o saldo de cada loja bate na conferência.',
      n: 'Mariana Souza', r: 'Proprietária · Bonsucesso Varejo, SP', m: '4 lojas · 1.688 SKUs' },
    { q: 'A leitura de nota por foto mudou meu mês. Eu gastava duas noites por semana digitando entrada de mercadoria.',
      n: 'Ana Ribeiro', r: 'Gestora de estoque · Loja Centro, SP', m: '486 notas lidas' },
    { q: 'O sistema apontou um item com saldo 204 que não estava na prateleira. Eu levaria mais um mês para descobrir isso no inventário.',
      n: 'Roberto Lima', r: 'Gestor financeiro · Ferragens União, PR', m: 'R$ 3.916 recuperados' },
  ];
  return (
    <section style={{ ...SECTION, paddingBottom: 80 }}>
      <div className="lp-g3">
        {quotes.map(t => (
          <div key={t.n} className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column' }}>
            <div style={{ color: 'var(--accent-text)', fontSize: 30, lineHeight: 1, fontWeight: 600, letterSpacing: '-0.04em' }}>“</div>
            <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.6, flex: 1, textWrap: 'pretty' }}>{t.q}</p>
            <div style={{ borderTop: '1px solid var(--line)', marginTop: 18, paddingTop: 14, display: 'flex', alignItems: 'center', gap: 11 }}>
              <StoreAvatar name={t.n} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>{t.n}</div>
                <div style={{ fontSize: 11.5, color: 'var(--fg-muted)' }}>{t.r}</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--accent-text)', marginTop: 10, fontFamily: 'var(--font-mono)' }}>{t.m}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// === 10 · PRICING TEASER ===
// Mostra mensal e anual lado a lado. O anual não é só desconto: é o mecanismo de
// fidelidade (2 meses grátis, créditos que acumulam, preço travado), então os
// benefícios do ciclo aparecem junto com os do plano.

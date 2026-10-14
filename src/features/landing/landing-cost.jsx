"use client";

import { SECTION } from '@/features/landing/section';
import { Eyebrow } from '@/features/landing/eyebrow';
import { H2 } from '@/features/landing/h2';
import { Lead } from '@/features/landing/lead';
import { I } from '@/components/icons';

export function LandingCost() {
  const problems = [
    { n: 'Venda perdida', l: 'quando falta o que o cliente pede', d: 'O cliente pede, você não tem, ele compra do vizinho. Ninguém registra essa venda que não aconteceu.', s: '31% dos clientes compram no concorrente quando falta¹', icon: 'Alert' },
    { n: 'Capital parado', l: 'em item que não gira', d: 'Dinheiro parado em prateleira enquanto o que vende fica em falta. Sem curva ABC, você não sabe qual é qual.', s: '12,3% dos itens em falta nos supermercados em 2025²', icon: 'Credit' },
    { n: 'Inventário lento', l: 'contagem no papel', d: 'Contagem em papel, digitação à noite, divergência sem explicação.', s: '65% dos registros de estoque divergem da prateleira³', icon: 'Activity' },
    { n: 'Custo errado', l: 'digitado na entrada', d: 'Custo errado na entrada significa margem errada no relatório e decisão de compra errada.', s: '1,65% do faturamento do varejo vira perda⁴', icon: 'Truck' },
  ];
  return (
    <section style={{ ...SECTION, paddingBottom: 80 }}>
      <Eyebrow>O que a planilha está cobrando de você</Eyebrow>
      <H2>Estoque descontrolado não dá prejuízo visível.<br/>Dá prejuízo invisível.</H2>
      <Lead>
        Nenhum desses custos aparece no seu extrato. Eles aparecem no crescimento que não veio.
      </Lead>

      <div className="lp-g4" style={{ marginTop: 36 }}>
        {problems.map(p => {
          const Ico = I[p.icon] || I.Alert;
          return (
            <div key={p.l} style={{
              padding: 20, background: 'var(--bg-elev)',
              border: '1px solid var(--line)', borderRadius: 11,
            }}>
              <span style={{
                width: 30, height: 30, borderRadius: 8,
                background: 'var(--danger-soft)', color: 'var(--danger)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><Ico size={15} /></span>
              <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-0.02em', marginTop: 14 }}>{p.n}</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)', marginTop: 2 }}>{p.l}</div>
              <p style={{ margin: '10px 0 0', fontSize: 12.5, color: 'var(--fg-muted)', lineHeight: 1.55 }}>{p.d}</p>
              <p style={{ margin: '12px 0 0', fontSize: 12.5, fontWeight: 600, color: 'var(--danger)', lineHeight: 1.45 }}>{p.s}</p>
            </div>
          );
        })}
      </div>
      {/* Estatísticas de mercado com fonte — nunca número de cliente ou resultado inventado. */}
      <p style={{ margin: '16px 0 0', fontSize: 11.5, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
        ¹ GMA/FMI, Retail Out-of-Stocks: A Worldwide Examination (2002) · ² Neogrid, Índice de Ruptura, média de 2025 ·
        ³ DeHoratius &amp; Raman, Management Science (2008) · ⁴ 9ª Pesquisa Abrappe de Perdas no Varejo Brasileiro (2026, dados de 2025)
      </p>
    </section>
  );
}

// === 4 · SEGMENTS (anti-vertical proof) ===

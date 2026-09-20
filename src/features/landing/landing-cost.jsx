"use client";

import { SECTION } from '@/features/landing/section';
import { Eyebrow } from '@/features/landing/eyebrow';
import { H2 } from '@/features/landing/h2';
import { Lead } from '@/features/landing/lead';
import { I } from '@/components/icons';

export function LandingCost() {
  const problems = [
    { n: 'R$ 4.800', l: 'por mês em venda perdida', d: 'O cliente pede, você não tem, ele compra do vizinho. Ninguém registra essa venda que não aconteceu.', icon: 'Alert' },
    { n: '38%', l: 'do capital em item que não gira', d: 'Dinheiro parado em prateleira enquanto o que vende fica em falta. Sem curva ABC, você não sabe qual é qual.', icon: 'Credit' },
    { n: '2 dias', l: 'para fechar um inventário', d: 'Contagem em papel, digitação à noite, divergência sem explicação. Todo mês.', icon: 'Activity' },
    { n: '1 em 5', l: 'notas com erro de digitação', d: 'Custo errado na entrada significa margem errada no relatório e decisão de compra errada.', icon: 'Truck' },
  ];
  return (
    <section style={{ ...SECTION, paddingBottom: 80 }}>
      <Eyebrow>O que a planilha está cobrando de você</Eyebrow>
      <H2>Estoque descontrolado não dá prejuízo visível.<br/>Dá prejuízo invisível.</H2>
      <Lead>
        Nenhum desses números aparece no seu extrato. Eles aparecem no crescimento que não veio.
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
              <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.028em', marginTop: 14, fontVariantNumeric: 'tabular-nums' }}>{p.n}</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)', marginTop: 2 }}>{p.l}</div>
              <p style={{ margin: '10px 0 0', fontSize: 12.5, color: 'var(--fg-muted)', lineHeight: 1.55 }}>{p.d}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// === 4 · SEGMENTS (anti-vertical proof) ===

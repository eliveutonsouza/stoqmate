"use client";

import { I } from '@/components/icons';
import { SECTION } from '@/features/landing/section';
import { Eyebrow } from '@/features/landing/eyebrow';
import { H2 } from '@/features/landing/h2';
import { Lead } from '@/features/landing/lead';

export function LandingCompare() {
  const rows = [
    ['Controle por variação de produto', 'manual e frágil', true, 'genérico'],
    ['Multi-loja com saldo isolado', false, true, 'cobrado à parte'],
    ['Transferência entre unidades', false, true, false],
    ['Curva ABC e giro de estoque', false, true, false],
    ['Leitura de nota por foto', false, true, false],
    ['Previsão de demanda', false, true, false],
    ['Detecção de estoque fantasma', false, true, false],
    ['Pergunta em linguagem natural', false, true, false],
    ['Preço a partir de', 'R$ 0', 'R$ 89', 'R$ 149 a R$ 379'],
  ];
  const Cell = ({ v, highlight }) => {
    if (v === true) return <span style={{ color: highlight ? 'var(--accent-text)' : 'var(--success)', display: 'inline-flex' }}><I.Check size={15} stroke={2.4} /></span>;
    if (v === false) return <span style={{ color: 'var(--fg-muted)' }} title="Não tem">—</span>;
    return <span style={{ fontSize: 12.5, color: highlight ? 'var(--fg)' : 'var(--fg-muted)', fontWeight: highlight ? 600 : 400 }}>{v}</span>;
  };
  return (
    <section style={{ ...SECTION, paddingBottom: 80 }}>
      <Eyebrow>Comparação honesta</Eyebrow>
      <H2>Mais barato que os concorrentes. E os concorrentes não têm IA.</H2>
      <Lead>
        Sistemas de gestão para varejo custam entre R$ 149 e R$ 379 por mês no Brasil, sem nenhum recurso de IA incluído.
      </Lead>

      <div className="card table-scroll" style={{ marginTop: 32 }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: '40%' }}>Recurso</th>
              <th style={{ textAlign: 'center' }}>Planilha</th>
              <th style={{ textAlign: 'center', background: 'var(--accent-soft)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: 'var(--accent-text)', fontWeight: 600 }}>
                  <I.Brand size={14} /> Stoqmate
                </span>
              </th>
              <th style={{ textAlign: 'center' }}>Concorrentes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, a, b, c]) => (
              <tr key={label}>
                <td style={{ fontSize: 13 }}>{label}</td>
                <td style={{ textAlign: 'center' }}><Cell v={a} /></td>
                <td style={{ textAlign: 'center', background: 'var(--accent-soft)' }}><Cell v={b} highlight /></td>
                <td style={{ textAlign: 'center' }}><Cell v={c} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// === 9 · TESTIMONIALS ===

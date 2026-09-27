"use client";

import { I } from '@/components/icons';
import { SECTION } from '@/features/landing/section';
import { Eyebrow } from '@/features/landing/eyebrow';
import { H2 } from '@/features/landing/h2';
import { Lead } from '@/features/landing/lead';

// Comparação só com a planilha — o que dá pra afirmar sem pesquisar preço e
// recurso de concorrente (que muda e não temos como sustentar).
export function LandingCompare() {
  const rows = [
    ['Controle por variação de produto (cor, tamanho…)', 'manual e frágil', true],
    ['Várias lojas com saldo separado', 'uma planilha por loja', true],
    ['Transferência entre unidades com conferência', false, true],
    ['Venda que baixa o estoque na hora', false, true],
    ['Aviso quando o item chega no mínimo', false, true],
    ['Curva ABC e giro de estoque', 'fórmula na mão', true],
    ['Leitura de nota por foto', false, true],
    ['Pergunta em linguagem natural', false, true],
    ['Quem pode ver custo e margem', 'todo mundo vê tudo', 'por perfil'],
  ];
  const Cell = ({ v, highlight }) => {
    if (v === true) return <span style={{ color: highlight ? 'var(--accent-text)' : 'var(--success)', display: 'inline-flex' }}><I.Check size={15} stroke={2.4} /></span>;
    if (v === false) return <span style={{ color: 'var(--fg-muted)' }} title="Não tem">—</span>;
    return <span style={{ fontSize: 12.5, color: highlight ? 'var(--fg)' : 'var(--fg-muted)', fontWeight: highlight ? 600 : 400 }}>{v}</span>;
  };
  return (
    <section style={{ ...SECTION, paddingBottom: 80 }}>
      <Eyebrow>Saindo da planilha</Eyebrow>
      <H2>O que muda quando o estoque sai da planilha.</H2>
      <Lead>
        A planilha aguenta uma loja e um responsável. Com mais gente vendendo e mais de uma unidade, ela deixa de bater.
      </Lead>

      <div className="card table-scroll" style={{ marginTop: 32 }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: '50%' }}>Recurso</th>
              <th style={{ textAlign: 'center' }}>Planilha</th>
              <th style={{ textAlign: 'center', background: 'var(--accent-soft)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: 'var(--accent-text)', fontWeight: 600 }}>
                  <I.Brand size={14} /> Stoqmate
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, a, b]) => (
              <tr key={label}>
                <td style={{ fontSize: 13 }}>{label}</td>
                <td style={{ textAlign: 'center' }}><Cell v={a} /></td>
                <td style={{ textAlign: 'center', background: 'var(--accent-soft)' }}><Cell v={b} highlight /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

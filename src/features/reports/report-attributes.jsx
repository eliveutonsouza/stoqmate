"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { MOCK, catById } from '@/lib/mock';
import { StoreShell } from '@/components/ui/store-shell';
import { ReportHeader } from '@/components/domain/report-header';
import { Page } from '@/components/ui/page-container';
import { ReportTabs } from '@/components/domain/report-tabs';
import { I } from '@/components/icons';
import { colorHex, isColorValue } from '@/lib/attr-colors';
import { AttrChip } from '@/components/ui/attr-chip';

export function ReportAttributes() {
  const navigate = useNavigate();
  const [catId, setCatId] = React.useState('vestuario');
  const cat = catById(catId);

  // Sales broken down by each attribute of the selected category
  const DATA = {
    vestuario: {
      cor: [
        { v: 'Preto', units: 386, revenue: 31820 }, { v: 'Branco', units: 342, revenue: 28140 },
        { v: 'Cinza', units: 218, revenue: 18960 }, { v: 'Azul', units: 164, revenue: 13420 },
        { v: 'Vermelho', units: 98, revenue: 8060 }, { v: 'Bege', units: 76, revenue: 6240 },
      ],
      tamanho: [
        { v: 'P', units: 184, revenue: 15180 }, { v: 'M', units: 428, revenue: 35260 },
        { v: 'G', units: 396, revenue: 32640 }, { v: 'GG', units: 186, revenue: 15320 },
        { v: 'XG', units: 62, revenue: 5100 }, { v: 'PP', units: 28, revenue: 2140 },
      ],
    },
    calcados: {
      cor: [
        { v: 'Preto', units: 312, revenue: 38420 }, { v: 'Branco', units: 186, revenue: 22840 },
        { v: 'Cinza', units: 142, revenue: 17460 }, { v: 'Azul Marinho', units: 118, revenue: 14520 },
        { v: 'Rosa', units: 56, revenue: 6880 }, { v: 'Verde', units: 34, revenue: 4160 },
      ],
      numeracao: [
        { v: '38', units: 124, revenue: 15240 }, { v: '39', units: 148, revenue: 18180 },
        { v: '40', units: 186, revenue: 22860 }, { v: '41', units: 172, revenue: 21140 },
        { v: '42', units: 128, revenue: 15720 }, { v: '43', units: 90, revenue: 11140 },
      ],
    },
    eletronicos: {
      cor: [
        { v: 'Preto', units: 428, revenue: 82140 }, { v: 'Branco', units: 148, revenue: 28420 },
        { v: 'Cinza', units: 46, revenue: 6180 }, { v: 'Azul', units: 20, revenue: 1680 },
      ],
      capacidade: [
        { v: '64 GB', units: 96, revenue: 14280 }, { v: '128 GB', units: 284, revenue: 54860 },
        { v: '256 GB', units: 186, revenue: 38420 }, { v: '512 GB', units: 62, revenue: 9240 },
        { v: '1 TB', units: 14, revenue: 1620 },
      ],
    },
    alimentos: {
      sabor: [
        { v: 'Intenso', units: 486, revenue: 29160 }, { v: 'Tradicional', units: 342, revenue: 20520 },
        { v: 'Frutas Vermelhas', units: 98, revenue: 5880 }, { v: 'Descafeinado', units: 60, revenue: 2680 },
      ],
      peso: [
        { v: '250 g', units: 284, revenue: 8520 }, { v: '500 g', units: 386, revenue: 17370 },
        { v: '1 kg', units: 268, revenue: 16080 }, { v: '5 kg', units: 48, revenue: 16270 },
      ],
    },
    casa: {
      cor: [
        { v: 'Branco', units: 128, revenue: 16240 }, { v: 'Bege', units: 96, revenue: 12180 },
        { v: 'Cinza', units: 62, revenue: 7860 }, { v: 'Verde', units: 38, revenue: 4820 }, { v: 'Marrom', units: 18, revenue: 1080 },
      ],
      material: [
        { v: 'Algodão', units: 164, revenue: 20820 }, { v: 'Cerâmica', units: 86, revenue: 10920 },
        { v: 'Vidro', units: 48, revenue: 6080 }, { v: 'Madeira', units: 28, revenue: 3540 }, { v: 'Inox', units: 16, revenue: 820 },
      ],
    },
    papelaria: {
      cor: [
        { v: 'Preto', units: 96, revenue: 12180 }, { v: 'Azul', units: 48, revenue: 6080 },
        { v: 'Vermelho', units: 26, revenue: 3280 }, { v: 'Verde', units: 14, revenue: 1460 },
      ],
      formato: [
        { v: 'A4', units: 112, revenue: 14240 }, { v: 'A5', units: 44, revenue: 5580 },
        { v: 'Ofício', units: 18, revenue: 2280 }, { v: 'Carta', units: 10, revenue: 900 },
      ],
    },
  };

  const schema = DATA[catId] || {};

  return (
    <StoreShell route="/reports/attributes" breadcrumb={['Relatórios', 'Atributos']} navigate={navigate}>
      <ReportHeader title="Atributos mais vendidos" sub="Quais variações giram — no esquema de cada categoria" />
      <Page>
        <ReportTabs route="/reports/attributes" navigate={navigate} />

        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
          padding: '10px 12px', background: 'var(--bg-elev)',
          border: '1px solid var(--line)', borderRadius: 8,
        }}>
          <span style={{ fontSize: 12, color: 'var(--fg-muted)', marginRight: 2 }}>Categoria</span>
          {MOCK.categories.map(cc => {
            const active = catId === cc.id;
            const CIco = I[cc.icon] || I.Box;
            return (
              <button key={cc.id} onClick={() => setCatId(cc.id)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                height: 28, padding: '0 11px',
                border: '1px solid ' + (active ? 'var(--accent)' : 'var(--line)'),
                background: active ? 'var(--accent-soft)' : 'var(--bg-elev)',
                color: active ? 'var(--accent-text)' : 'var(--fg-muted)',
                borderRadius: 5, fontSize: 12, fontWeight: active ? 500 : 400,
              }}>
                <span style={{ color: active ? 'var(--accent-text)' : cc.cssInk, display: 'flex' }}><CIco size={12} /></span>
                {cc.name}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cat.attributes.length}, minmax(0, 1fr))`, gap: 16 }}>
          {cat.attributes.map(attr => {
            const rows = schema[attr.key] || [];
            const maxU = Math.max(...rows.map(r => r.units), 1);
            const totalU = rows.reduce((s, r) => s + r.units, 0);
            const leader = rows.reduce((a, b) => (a.units > b.units ? a : b), rows[0] || {});
            return (
              <div key={attr.key} className="card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>{attr.label}</h3>
                    <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>
                      Líder: <strong style={{ color: 'var(--fg)', fontWeight: 500 }}>{leader.v}</strong> com {((leader.units / totalU) * 100).toFixed(0)}% do volume.
                    </p>
                  </div>
                  <span className="badge">{attr.type === 'color' ? 'Cor' : attr.type === 'size' ? 'Tamanho' : 'Especificação'}</span>
                </div>

                {attr.type === 'color' && (
                  <div style={{ display: 'flex', height: 8, margin: '14px 18px 0', borderRadius: 4, overflow: 'hidden' }}>
                    {rows.map((r, i) => (
                      <div key={r.v} title={r.v} style={{
                        width: `${(r.units / totalU) * 100}%`,
                        background: colorHex(r.v),
                        borderRight: i < rows.length - 1 ? '1px solid var(--bg-elev)' : 'none',
                      }}></div>
                    ))}
                  </div>
                )}

                <table className="table">
                  <thead>
                    <tr><th style={{ width: 26 }}>#</th><th>Valor</th><th style={{ width: '32%' }}>Volume</th><th className="num">Receita</th><th className="num">Share</th></tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={r.v}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)' }}>{i + 1}</td>
                        <td><AttrChip value={r.v} /></td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                            <div style={{ flex: 1, height: 4, background: 'var(--bg-sunken)', borderRadius: 2 }}>
                              <div style={{
                                width: `${(r.units / maxU) * 100}%`, height: '100%',
                                background: isColorValue(r.v) ? colorHex(r.v) : 'var(--accent)',
                                borderRadius: 2,
                                border: r.v === 'Branco' ? '1px solid var(--line-strong)' : 'none',
                                boxSizing: 'border-box',
                              }}></div>
                            </div>
                            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)', minWidth: 28, textAlign: 'right' }}>{r.units}</span>
                          </div>
                        </td>
                        <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>R$ {r.revenue.toLocaleString('pt-BR')}</td>
                        <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{((r.units / totalU) * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>

        <div style={{ padding: '12px 14px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 8, display: 'flex', gap: 11, alignItems: 'center' }}>
          <span style={{ color: 'var(--fg-muted)', flexShrink: 0 }}><I.Sliders size={15} /></span>
          <div style={{ fontSize: 12, color: 'var(--fg-muted)', flex: 1, lineHeight: 1.5 }}>
            Este relatório se adapta ao esquema: adicione um atributo em <strong style={{ color: 'var(--fg)', fontWeight: 500 }}>{cat.name}</strong> e ele ganha uma coluna aqui automaticamente.
          </div>
          <button onClick={() => navigate('/categories')} className="btn btn-outline btn-sm">Editar esquema</button>
        </div>
      </Page>
    </StoreShell>
  );
}

// === Profit ===

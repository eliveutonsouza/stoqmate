"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { CATALOG } from '@/lib/catalog';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { FormCard } from '@/components/ui/form-card';
import { Field } from '@/components/ui/field';
import { SelectInput } from '@/components/ui/select-input';
import { MOCK } from '@/lib/mock';
import { TextInput } from '@/components/ui/text-input';
import { ProductThumb } from '@/components/ui/product-thumb';
import { brl } from '@/lib/format';
import { SummaryRow } from '@/components/ui/summary-row';

export function BulkPricing() {
  const navigate = useNavigate();
  const [scope, setScope] = React.useState('supplier');
  const [mode, setMode] = React.useState('cost');
  const [pct, setPct] = React.useState(8);
  const [rounding, setRounding] = React.useState('90');

  const affected = CATALOG.filter(p => p.supplier === 'TechDistrib' || p.cat === 'eletronicos');
  const round = (v) => {
    if (rounding === 'none') return v;
    if (rounding === '90') return Math.floor(v) + 0.90;
    if (rounding === '99') return Math.floor(v) + 0.99;
    return Math.round(v / 5) * 5;
  };
  const rows = affected.map(p => {
    const cost = p.sale * 0.53;
    const newCost = mode === 'cost' ? cost * (1 + pct / 100) : cost;
    const newSale = mode === 'cost' ? round(p.sale * (1 + pct / 100)) : round(p.sale * (1 + pct / 100));
    return { ...p, cost, newCost, newSale, oldMargin: ((p.sale - cost) / p.sale) * 100, newMargin: ((newSale - newCost) / newSale) * 100 };
  });
  const avgOld = rows.reduce((s, r) => s + r.oldMargin, 0) / rows.length;
  const avgNew = rows.reduce((s, r) => s + r.newMargin, 0) / rows.length;

  return (
    <StoreShell route="/products/pricing" breadcrumb={['Catálogo', 'Reajuste de preços']} navigate={navigate}>
      <PageHeader
        title="Reajuste de preços em lote"
        sub="Fornecedor aumentou? Repasse para dezenas de SKUs de uma vez, sem abrir um por um."
        actions={<button className="btn btn-outline btn-sm"><I.Download size={13} /> Exportar simulação</button>}
      />
      <Page>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 16, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <FormCard title="A quais produtos aplicar" cols={1}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {[
                  { k: 'supplier', t: 'Por fornecedor', d: 'Todos os SKUs de um fornecedor.' },
                  { k: 'category', t: 'Por categoria', d: 'Todos os SKUs de uma categoria.' },
                  { k: 'brand', t: 'Por marca', d: 'Todos os SKUs de uma marca.' },
                  { k: 'class', t: 'Por classe ABC', d: 'Ex.: só classe C, para liquidar.' },
                ].map(o => (
                  <button key={o.k} onClick={() => setScope(o.k)} style={{
                    display: 'flex', gap: 11, alignItems: 'flex-start', textAlign: 'left',
                    padding: '11px 13px',
                    border: '1px solid ' + (scope === o.k ? 'var(--accent)' : 'var(--line)'),
                    background: scope === o.k ? 'var(--accent-soft)' : 'var(--bg-elev)',
                    borderRadius: 7,
                  }}>
                    <span style={{
                      width: 14, height: 14, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                      border: '1px solid ' + (scope === o.k ? 'var(--accent)' : 'var(--line-strong)'),
                      background: scope === o.k ? 'var(--accent-strong)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                    }}>{scope === o.k && <I.Check size={9} stroke={3} />}</span>
                    <span>
                      <span style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--fg)' }}>{o.t}</span>
                      <span style={{ display: 'block', fontSize: 12, color: 'var(--fg-muted)', marginTop: 1 }}>{o.d}</span>
                    </span>
                  </button>
                ))}
              </div>
              <Field label={scope === 'supplier' ? 'Fornecedor' : scope === 'category' ? 'Categoria' : scope === 'brand' ? 'Marca' : 'Classe'} required>
                <SelectInput
                  value={scope === 'supplier' ? 'TechDistrib' : scope === 'category' ? 'Eletrônicos' : scope === 'brand' ? 'Foneclear' : 'Classe C'}
                  onChange={() => {}}
                  options={scope === 'supplier' ? ['TechDistrib', 'Vento Sul', 'Malha & Cia', 'Grão Nobre', 'Lar Import', 'Papel Forte']
                    : scope === 'category' ? MOCK.categories.map(c => c.name)
                    : scope === 'brand' ? ['Foneclear', 'Voltway', 'Olympikus', 'Malharia Sul', 'Serra Alta']
                    : ['Classe A', 'Classe B', 'Classe C']} />
              </Field>
            </FormCard>

            <FormCard title="Como reajustar" cols={2}>
              <Field label="Base do reajuste" span={2}>
                <div style={{ display: 'flex', gap: 2, padding: 3, background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 7 }}>
                  {[
                    { k: 'cost', l: 'Custo subiu — repassar' },
                    { k: 'sale', l: 'Só o preço de venda' },
                    { k: 'margin', l: 'Fixar margem alvo' },
                  ].map(o => (
                    <button key={o.k} onClick={() => setMode(o.k)} style={{
                      flex: 1, background: mode === o.k ? 'var(--bg-elev)' : 'transparent',
                      border: '1px solid ' + (mode === o.k ? 'var(--line)' : 'transparent'),
                      borderRadius: 5, padding: '6px 10px', fontSize: 12.5, fontWeight: 500,
                      color: mode === o.k ? 'var(--fg)' : 'var(--fg-muted)',
                    }}>{o.l}</button>
                  ))}
                </div>
              </Field>
              <Field label={mode === 'margin' ? 'Margem alvo' : 'Percentual'} required span={1}
                hint={mode === 'cost' ? 'Aplicado ao custo e repassado à venda.' : 'Use valor negativo para reduzir.'}>
                <TextInput mono type="number" value={pct} onChange={(e) => setPct(+e.target.value || 0)} suffix="%" />
              </Field>
              <Field label="Arredondamento do preço final" span={1} hint="Preço psicológico de varejo.">
                <SelectInput value={rounding} onChange={setRounding} options={[
                  { value: 'none', label: 'Sem arredondar' },
                  { value: '90', label: 'Terminar em ,90' },
                  { value: '99', label: 'Terminar em ,99' },
                  { value: '5', label: 'Múltiplo de R$ 5' },
                ]} />
              </Field>
              <Field label="Vigência" span={1}>
                <SelectInput value="Imediata" onChange={() => {}} options={['Imediata', 'Agendar para data', 'Só após aprovação']} />
              </Field>
              <Field label="Unidades" span={1}>
                <SelectInput value="Todas as unidades" onChange={() => {}} options={['Todas as unidades', ...MOCK.store.siblings.map(s => s.name)]} />
              </Field>
            </FormCard>

            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Simulação</h3>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>
                  Nada é gravado até confirmar. Revise as margens antes de aplicar.
                </p>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th className="num">Custo atual</th><th className="num">Custo novo</th>
                    <th className="num">Venda atual</th><th className="num">Venda nova</th>
                    <th className="num">Margem</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.sku}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <ProductThumb cat={r.cat} attrs={r.attrs} size={26} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>{r.name}</div>
                            <div style={{ fontSize: 10, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{r.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{brl(r.cost)}</td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{brl(r.newCost)}</td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)', textDecoration: 'line-through' }}>{brl(r.sale)}</td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600 }}>{brl(r.newSale)}</td>
                      <td className="num">
                        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>{r.oldMargin.toFixed(1)}%</span>
                        <span style={{ fontSize: 11, color: 'var(--fg-muted)', margin: '0 4px' }}>→</span>
                        <span style={{
                          fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 500,
                          color: r.newMargin >= r.oldMargin ? 'var(--success)' : r.newMargin < 25 ? 'var(--danger)' : 'var(--warning)',
                        }}>{r.newMargin.toFixed(1)}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 10 }}>Impacto</div>
              <SummaryRow label="SKUs afetados" value={`${rows.length}`} />
              <SummaryRow label="Reajuste aplicado" value={(pct > 0 ? '+' : '') + pct + '%'} />
              <div style={{ borderTop: '1px solid var(--line)', marginTop: 8, paddingTop: 8 }}>
                <SummaryRow label="Margem média antes" value={avgOld.toFixed(1) + '%'} />
                <SummaryRow label="Margem média depois" value={avgNew.toFixed(1) + '%'} strong
                  tone={avgNew >= avgOld ? 'success' : avgNew < 25 ? 'danger' : 'warning'} />
              </div>
              <div style={{ borderTop: '1px solid var(--line)', marginTop: 12, paddingTop: 12 }}>
                <SummaryRow label="Itens em estoque" value="248" />
                <SummaryRow label="Valor de estoque revalorizado" value={brl(39204 * (1 + pct / 100))} />
              </div>
            </div>

            <button onClick={() => navigate('/products')} className="btn btn-primary btn-lg" style={{ justifyContent: 'center', width: '100%' }}>
              Aplicar a {rows.length} SKUs
            </button>
            <button onClick={() => navigate('/products')} className="btn btn-ghost" style={{ justifyContent: 'center', width: '100%' }}>Cancelar</button>

            <div style={{ padding: '11px 13px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 8, display: 'flex', gap: 10 }}>
              <span style={{ color: 'var(--fg-muted)', flexShrink: 0, marginTop: 1 }}><I.Activity size={14} /></span>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
                Cada alteração entra no log com preço antigo e novo. Dá para reverter o lote inteiro em até 7 dias.
              </div>
            </div>
          </div>
        </div>
      </Page>
    </StoreShell>
  );
}

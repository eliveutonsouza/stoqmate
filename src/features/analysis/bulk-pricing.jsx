"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { FormCard } from '@/components/ui/form-card';
import { Field } from '@/components/ui/field';
import { SelectInput } from '@/components/ui/select-input';
import { TextInput } from '@/components/ui/text-input';
import { ProductThumb } from '@/components/ui/product-thumb';
import { brl } from '@/lib/format';
import { SummaryRow } from '@/components/ui/summary-row';
import { EmptyState } from '@/components/ui/empty-state';
import { previewPricingAction, bulkPriceUpdateAction } from '@/features/analysis/actions';

function round(v, rounding) {
  if (rounding === 'none') return Math.round(v * 100) / 100;
  if (rounding === '90') return Math.floor(v) + 0.90;
  if (rounding === '99') return Math.floor(v) + 0.99;
  return Math.round(v / 5) * 5;
}

export function BulkPricing({ suppliers, categories, brands }) {
  const navigate = useNavigate();
  const [scope, setScope] = React.useState('supplier');
  const [scopeValue, setScopeValue] = React.useState('');
  const [mode, setMode] = React.useState('cost');
  const [pct, setPct] = React.useState(8);
  const [rounding, setRounding] = React.useState('90');
  const [products, setProducts] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [result, setResult] = React.useState(null);
  const [pending, startTransition] = React.useTransition();

  const scopeOptions = scope === 'supplier' ? suppliers : scope === 'category' ? categories : brands.map((b) => ({ id: b, name: b }));

  const selectScope = (k) => { setScope(k); setScopeValue(''); setProducts([]); setResult(null); };
  const selectScopeValue = (v) => {
    setScopeValue(v);
    setResult(null);
    if (!v) { setProducts([]); return; }
    setLoading(true);
    previewPricingAction(scope, v).then((rows) => { setProducts(rows); setLoading(false); });
  };

  const rows = products.map((p) => {
    let newCost = p.cost_price;
    let newSale = p.sale_price;
    if (mode === 'cost') { newCost = p.cost_price * (1 + pct / 100); newSale = p.sale_price * (1 + pct / 100); }
    else if (mode === 'sale') { newSale = p.sale_price * (1 + pct / 100); }
    else if (pct < 100) { newSale = p.cost_price / (1 - pct / 100); }
    newSale = round(newSale, rounding);
    return {
      ...p, newCost, newSale,
      oldMargin: p.sale_price > 0 ? ((p.sale_price - p.cost_price) / p.sale_price) * 100 : 0,
      newMargin: newSale > 0 ? ((newSale - newCost) / newSale) * 100 : 0,
    };
  });
  const avgOld = rows.length ? rows.reduce((s, r) => s + r.oldMargin, 0) / rows.length : 0;
  const avgNew = rows.length ? rows.reduce((s, r) => s + r.newMargin, 0) / rows.length : 0;
  const canApply = scopeValue && rows.length > 0 && (mode !== 'margin' || pct < 100);

  const apply = () => {
    setError('');
    startTransition(async () => {
      const res = await bulkPriceUpdateAction({ scope, scopeValue, mode, pct, rounding });
      if (res?.error) { setError(res.error); return; }
      setResult(res);
      const fresh = await previewPricingAction(scope, scopeValue);
      setProducts(fresh);
    });
  };

  return (
    <StoreShell route="/products/pricing" breadcrumb={['Catálogo', 'Reajuste de preços']} navigate={navigate}>
      <PageHeader
        title="Reajuste de preços em lote"
        sub="Fornecedor aumentou? Repasse para dezenas de SKUs de uma vez, sem abrir um por um."
      />
      <Page>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 16, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <FormCard title="A quais produtos aplicar" cols={1}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  { k: 'supplier', t: 'Por fornecedor', d: 'Todos os SKUs de um fornecedor.' },
                  { k: 'category', t: 'Por categoria', d: 'Todos os SKUs de uma categoria.' },
                  { k: 'brand', t: 'Por marca', d: 'Todos os SKUs de uma marca.' },
                ].map(o => (
                  <button key={o.k} onClick={() => selectScope(o.k)} style={{
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
              <Field label={scope === 'supplier' ? 'Fornecedor' : scope === 'category' ? 'Categoria' : 'Marca'} required>
                <SelectInput
                  value={scopeValue} onChange={selectScopeValue} placeholder="Selecione…"
                  options={scopeOptions.map((o) => ({ value: o.id, label: o.name }))}
                />
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
                hint={mode === 'cost' ? 'Aplicado ao custo e repassado à venda.' : mode === 'margin' ? 'Novo preço de venda pra atingir essa margem.' : 'Use valor negativo para reduzir.'}>
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
            </FormCard>

            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Simulação</h3>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>
                  Nada é gravado até confirmar. Revise as margens antes de aplicar.
                </p>
              </div>
              {!scopeValue ? (
                <EmptyState icon={<I.Tag size={18} />} title="Selecione um fornecedor, categoria ou marca" desc="A simulação aparece assim que você escolher o escopo." />
              ) : loading ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--fg-muted)', fontSize: 12.5 }}>Carregando…</div>
              ) : rows.length === 0 ? (
                <EmptyState icon={<I.Box size={18} />} title="Nenhum produto neste escopo" desc="Escolha outro fornecedor, categoria ou marca." />
              ) : (
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
                      <tr key={r.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <ProductThumb category={r.category} brand={r.brand} attrs={r.attrs} size={26} />
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 500 }}>{r.name}</div>
                              <div style={{ fontSize: 10, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{r.sku}</div>
                            </div>
                          </div>
                        </td>
                        <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{brl(r.cost_price)}</td>
                        <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{brl(r.newCost)}</td>
                        <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)', textDecoration: 'line-through' }}>{brl(r.sale_price)}</td>
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
              )}
            </div>
          </div>

          <div style={{ position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 10 }}>Impacto</div>
              <SummaryRow label="SKUs afetados" value={`${rows.length}`} />
              {mode !== 'margin' && <SummaryRow label="Reajuste aplicado" value={(pct > 0 ? '+' : '') + pct + '%'} />}
              <div style={{ borderTop: '1px solid var(--line)', marginTop: 8, paddingTop: 8 }}>
                <SummaryRow label="Margem média antes" value={avgOld.toFixed(1) + '%'} />
                <SummaryRow label="Margem média depois" value={avgNew.toFixed(1) + '%'} strong
                  tone={avgNew >= avgOld ? 'success' : avgNew < 25 ? 'danger' : 'warning'} />
              </div>
            </div>

            {result && (
              <div style={{ padding: '10px 13px', background: 'var(--success-soft)', border: '1px solid var(--success)', borderRadius: 7, fontSize: 12.5 }}>
                {result.count} SKUs reajustados com sucesso.
              </div>
            )}
            {error && (
              <div style={{ padding: '10px 13px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 7, fontSize: 12.5 }}>
                {error}
              </div>
            )}

            <button onClick={apply} disabled={!canApply || pending} className="btn btn-primary btn-lg" style={{ justifyContent: 'center', width: '100%', opacity: canApply && !pending ? 1 : 0.5 }}>
              {pending ? 'Aplicando…' : `Aplicar a ${rows.length} SKUs`}
            </button>
            <button onClick={() => navigate('/products')} className="btn btn-ghost" style={{ justifyContent: 'center', width: '100%' }}>Voltar</button>

            <div style={{ padding: '11px 13px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 8, display: 'flex', gap: 10 }}>
              <span style={{ color: 'var(--fg-muted)', flexShrink: 0, marginTop: 1 }}><I.Activity size={14} /></span>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
                O reajuste em lote fica registrado no log de auditoria com quantidade de SKUs e percentual aplicado.
              </div>
            </div>
          </div>
        </div>
      </Page>
    </StoreShell>
  );
}

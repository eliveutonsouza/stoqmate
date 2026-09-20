"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { MovementNav } from '@/features/stock/movement-nav';
import { FormCard } from '@/components/ui/form-card';
import { Field } from '@/components/ui/field';
import { SelectInput } from '@/components/ui/select-input';
import { ProductPicker } from '@/components/ui/product-picker';
import { ProductThumb } from '@/components/ui/product-thumb';
import { AttrChip } from '@/components/ui/attr-chip';
import { variantLabel } from '@/lib/attr-colors';
import { TextInput } from '@/components/ui/text-input';
import { brl } from '@/lib/format';
import { TextareaInput } from '@/components/ui/textarea-input';
import { SummaryRow } from '@/components/ui/summary-row';
import { stockCountSubmitAction } from '@/features/stock/actions';

const REASONS = ['Erro de lançamento anterior', 'Furto / extravio', 'Item danificado descartado', 'Venda não registrada', 'Transferência não confirmada'];

export function StockCount({ stores, locations, categories }) {
  const navigate = useNavigate();
  const [storeId, setStoreId] = React.useState(stores[0]?.id ?? '');
  const [locationId, setLocationId] = React.useState('');
  const [categoryId, setCategoryId] = React.useState('');
  const [rows, setRows] = React.useState([]);
  const [reason, setReason] = React.useState(REASONS[0]);
  const [justification, setJustification] = React.useState('');
  const [error, setError] = React.useState('');
  const [pending, startTransition] = React.useTransition();

  const addProduct = (product) => {
    if (rows.some((r) => r.product.id === product.id)) return;
    const system = (product.stock_balances || []).find((b) => b.store_id === storeId)?.qty ?? 0;
    setRows((rs) => [...rs, { product, system, real: null }]);
  };
  const setReal = (i, v) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, real: v } : r)));
  const removeRow = (i) => setRows((rs) => rs.filter((_, j) => j !== i));

  const counted = rows.filter((r) => r.real !== null);
  const diverging = counted.filter((r) => r.real !== r.system);
  const netValue = diverging.reduce((s, r) => s + (r.real - r.system) * (r.product.cost_price ?? 0), 0);
  const progress = rows.length ? (counted.length / rows.length) * 100 : 0;
  const canSave = counted.length > 0 && (diverging.length === 0 || justification.trim().length >= 20);

  const submit = () => {
    setError('');
    if (counted.length === 0) { setError('Conte pelo menos um item antes de fechar.'); return; }
    if (diverging.length > 0 && justification.trim().length < 20) { setError('Há divergência — detalhe a justificativa em pelo menos 20 caracteres.'); return; }
    startTransition(async () => {
      const result = await stockCountSubmitAction({
        storeId, locationId: locationId || null, categoryId: categoryId || null,
        items: counted.map((r) => ({ productId: r.product.id, countedQty: r.real })),
        reason: diverging.length > 0 ? reason : '', justification: diverging.length > 0 ? justification : '',
      });
      if (result?.error) { setError(result.error); return; }
      navigate('/stock/history');
    });
  };

  return (
    <StoreShell route="/stock/count" breadcrumb={['Estoque', 'Contagem de inventário']} navigate={navigate}>
      <PageHeader title="Contagem de inventário" sub="Adicione os produtos conferidos e informe a contagem física de cada um." />
      <Page>
        <MovementNav route="/stock/adjustment" navigate={navigate} />

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 16, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <FormCard title="Escopo da contagem" cols={3}>
              <Field label="Unidade" span={1}>
                <SelectInput value={storeId} onChange={setStoreId} options={stores.map((s) => ({ value: s.id, label: s.name }))} />
              </Field>
              <Field label="Local" span={1} hint="Opcional, só pra registro.">
                <SelectInput value={locationId} onChange={setLocationId} options={locations.map((l) => ({ value: l.id, label: l.code }))} placeholder="Todos os locais" />
              </Field>
              <Field label="Categoria" span={1} hint="Opcional, pra fatiar a contagem.">
                <SelectInput value={categoryId} onChange={setCategoryId} options={categories.map((c) => ({ value: c.id, label: c.name }))} placeholder="Todas" />
              </Field>
            </FormCard>

            <FormCard title="Adicionar produto" cols={1}>
              <ProductPicker product={null} storeId={storeId} onSelect={addProduct} />
            </FormCard>

            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Folha de contagem</h3>
                    <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>
                      {counted.length} de {rows.length} SKUs contados. Deixe em branco o que ainda não foi conferido.
                    </p>
                  </div>
                  {rows.length > 0 && <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>{progress.toFixed(0)}%</span>}
                </div>
                {rows.length > 0 && (
                  <div style={{ height: 5, background: 'var(--bg-sunken)', borderRadius: 3 }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent)', borderRadius: 3, transition: 'width 120ms ease' }}></div>
                  </div>
                )}
              </div>
              {rows.length === 0 ? (
                <div style={{ padding: '24px 18px', fontSize: 12.5, color: 'var(--fg-muted)' }}>Busque e adicione produtos acima pra começar a contagem.</div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Produto</th><th>Variação</th>
                      <th className="num">Sistema</th><th style={{ width: 110 }}>Contagem</th>
                      <th className="num">Diferença</th><th className="num">Impacto</th><th style={{ width: 30 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => {
                      const done = r.real !== null;
                      const diff = done ? r.real - r.system : 0;
                      return (
                        <tr key={r.product.id} style={{ opacity: done ? 1 : 0.65 }}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <ProductThumb category={r.product.category} attrs={r.product.attrs} size={26} />
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 500 }}>{r.product.name}</div>
                                <div style={{ fontSize: 10, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{r.product.sku}</div>
                              </div>
                            </div>
                          </td>
                          <td><AttrChip value={variantLabel(r.product.attrs || {})} /></td>
                          <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{r.system}</td>
                          <td>
                            <TextInput mono type="number" value={r.real ?? ''} placeholder="—"
                              onChange={(e) => setReal(i, e.target.value === '' ? null : +e.target.value)} style={{ height: 28 }} />
                          </td>
                          <td className="num">
                            {!done ? <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>—</span> : (
                              <span style={{
                                fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: diff ? 600 : 400,
                                color: diff === 0 ? 'var(--success)' : diff < 0 ? 'var(--danger)' : 'var(--warning)',
                              }}>{diff === 0 ? 'OK' : (diff > 0 ? '+' : '') + diff}</span>
                            )}
                          </td>
                          <td className="num" style={{
                            fontFamily: 'var(--font-mono)', fontSize: 12,
                            color: !done || diff === 0 ? 'var(--fg-muted)' : diff < 0 ? 'var(--danger)' : 'var(--fg)',
                          }}>{!done || diff === 0 ? '—' : (diff < 0 ? '−' : '+') + brl(Math.abs(diff * (r.product.cost_price ?? 0)))}</td>
                          <td><button onClick={() => removeRow(i)} className="btn btn-ghost btn-icon btn-sm"><I.X size={12} /></button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {diverging.length > 0 && (
              <FormCard title="Justificativa" desc="Obrigatória quando há divergência. Fica registrada no log de auditoria." cols={1}>
                <Field label="Motivo predominante" required>
                  <SelectInput value={reason} onChange={setReason} options={REASONS} />
                </Field>
                <Field label="Detalhamento" required hint="Mínimo 20 caracteres.">
                  <TextareaInput value={justification} onChange={(e) => setJustification(e.target.value)} style={{ minHeight: 72 }}
                    placeholder="Ex.: contagem completa da prateleira A-04 com dois conferentes." />
                </Field>
              </FormCard>
            )}

            {error && (
              <div style={{ padding: '10px 13px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 7, fontSize: 12.5, color: 'var(--fg)' }}>
                {error}
              </div>
            )}
          </div>

          <div style={{ position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 10 }}>Resultado da sessão</div>
              <SummaryRow label="SKUs no escopo" value={`${rows.length}`} />
              <SummaryRow label="Contados" value={`${counted.length}`} />
              <SummaryRow label="Pendentes" value={`${rows.length - counted.length}`} tone={rows.length - counted.length ? 'warning' : undefined} />
              <div style={{ borderTop: '1px solid var(--line)', marginTop: 8, paddingTop: 8 }}>
                <SummaryRow label="Com divergência" value={`${diverging.length}`} tone={diverging.length ? 'danger' : 'success'} />
              </div>
              <div style={{ borderTop: '1px solid var(--line)', marginTop: 12, paddingTop: 12 }}>
                <SummaryRow
                  label={netValue < 0 ? 'Perda líquida' : netValue > 0 ? 'Sobra líquida' : 'Impacto financeiro'}
                  value={brl(Math.abs(netValue))} strong
                  tone={netValue < 0 ? 'danger' : netValue > 0 ? 'warning' : 'success'}
                />
              </div>
            </div>

            <button onClick={submit} className="btn btn-primary btn-lg"
              disabled={!canSave || pending} style={{ justifyContent: 'center', width: '100%', opacity: canSave && !pending ? 1 : 0.45 }}>
              {pending ? 'Fechando…' : 'Fechar contagem e ajustar'}
            </button>
            <button onClick={() => navigate('/stock')} className="btn btn-ghost" style={{ justifyContent: 'center', width: '100%' }}>Cancelar sessão</button>
          </div>
        </div>
      </Page>
    </StoreShell>
  );
}

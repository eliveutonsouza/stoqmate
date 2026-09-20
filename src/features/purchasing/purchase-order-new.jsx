"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { REPLENISH } from '@/features/purchasing/replenish';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { FormCard } from '@/components/ui/form-card';
import { Field } from '@/components/ui/field';
import { SelectInput } from '@/components/ui/select-input';
import { MOCK } from '@/lib/mock';
import { TextInput } from '@/components/ui/text-input';
import { TextareaInput } from '@/components/ui/textarea-input';
import { ProductThumb } from '@/components/ui/product-thumb';
import { AttrChip } from '@/components/ui/attr-chip';
import { variantLabel } from '@/lib/attr-colors';
import { brl } from '@/lib/format';
import { SummaryRow } from '@/components/ui/summary-row';

export function PurchaseOrderNew() {
  const navigate = useNavigate();
  const lines = REPLENISH.filter(r => r.supplier === 'TechDistrib' && r.suggest > 0);
  const [qty, setQty] = React.useState(lines.map(l => l.suggest));
  const subtotal = lines.reduce((s, l, i) => s + qty[i] * l.cost, 0);
  const freight = 180;
  const total = subtotal + freight;
  const minOrder = 5000;

  return (
    <StoreShell route="/purchase-orders/new" breadcrumb={['Compras', 'Novo pedido']} navigate={navigate}>
      <PageHeader
        title="Pedido de compra"
        sub="TechDistrib · gerado a partir da sugestão de reposição de 18/09"
        actions={<button className="btn btn-outline btn-sm"><I.Download size={13} /> Pré-visualizar PDF</button>}
      />
      <Page>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 16, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <FormCard title="Fornecedor e entrega" cols={2}>
              <Field label="Fornecedor" required span={1}>
                <SelectInput value="TechDistrib" onChange={() => {}} options={['TechDistrib', 'Vento Sul', 'Malha & Cia', 'Grão Nobre', 'Lar Import', 'Papel Forte']} />
              </Field>
              <Field label="Entregar em" required span={1}>
                <SelectInput value="Centro de Distribuição" onChange={() => {}} options={MOCK.store.siblings.map(s => s.name)} />
              </Field>
              <Field label="Data desejada" span={1} hint="Prazo médio do fornecedor: 8 dias.">
                <TextInput type="date" defaultValue="2026-09-28" />
              </Field>
              <Field label="Condição de pagamento" span={1}>
                <SelectInput value="30/60 dias" onChange={() => {}} options={['À vista', '28 dias', '30/60 dias', '30/60/90 dias']} />
              </Field>
              <Field label="Observações ao fornecedor" span={2}>
                <TextareaInput placeholder="Ex.: entregar em horário comercial, agendar com o CD por telefone." />
              </Field>
            </FormCard>

            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Itens do pedido</h3>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Quantidades vieram da sugestão — ajuste se precisar.</p>
                </div>
                <button className="btn btn-outline btn-sm"><I.Plus size={12} /> Adicionar item</button>
              </div>
              <table className="table">
                <thead>
                  <tr><th>Produto</th><th>Variação</th><th className="num">Saldo</th><th style={{ width: 100 }}>Quantidade</th><th className="num">Custo un.</th><th className="num">Subtotal</th><th style={{ width: 30 }}></th></tr>
                </thead>
                <tbody>
                  {lines.map((l, i) => (
                    <tr key={l.sku}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <ProductThumb cat={l.cat} attrs={l.attrs} size={26} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>{l.name}</div>
                            <div style={{ fontSize: 10, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{l.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td><AttrChip value={variantLabel(l.attrs)} /></td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: l.stock < l.min ? 'var(--warning)' : 'var(--fg-muted)' }}>{l.stock}</td>
                      <td>
                        <TextInput mono type="number" value={qty[i]} onChange={(e) => setQty(q => q.map((v, j) => (j === i ? +e.target.value || 0 : v)))} style={{ height: 28 }} />
                      </td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{brl(l.cost)}</td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500 }}>{brl(qty[i] * l.cost)}</td>
                      <td><button className="btn btn-ghost btn-icon btn-sm"><I.X size={12} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 10 }}>Resumo do pedido</div>
              <SummaryRow label={`${lines.length} SKUs · ${qty.reduce((a, b) => a + b, 0)} itens`} value={brl(subtotal)} />
              <SummaryRow label="Frete estimado" value={brl(freight)} />
              <div style={{ borderTop: '1px solid var(--line)', marginTop: 8, paddingTop: 8 }}>
                <SummaryRow label="Total do pedido" value={brl(total)} strong />
              </div>
              <div style={{ borderTop: '1px solid var(--line)', marginTop: 12, paddingTop: 12 }}>
                <SummaryRow label="Pedido mínimo" value={brl(minOrder)} />
                <SummaryRow
                  label={subtotal >= minOrder ? 'Atende o mínimo' : 'Falta para o mínimo'}
                  value={subtotal >= minOrder ? 'OK' : brl(minOrder - subtotal)}
                  tone={subtotal >= minOrder ? 'success' : 'danger'}
                />
              </div>
            </div>

            <button onClick={() => navigate('/purchase-orders')} className="btn btn-primary btn-lg"
              disabled={subtotal < minOrder}
              style={{ justifyContent: 'center', width: '100%', opacity: subtotal >= minOrder ? 1 : 0.45 }}>
              {subtotal >= minOrder ? 'Enviar pedido' : 'Abaixo do pedido mínimo'}
            </button>
            <button className="btn btn-outline" style={{ justifyContent: 'center', width: '100%' }}>Salvar como rascunho</button>
            <button onClick={() => navigate('/purchase-orders')} className="btn btn-ghost" style={{ justifyContent: 'center', width: '100%' }}>Cancelar</button>

            <div style={{ padding: '11px 13px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 8, display: 'flex', gap: 10 }}>
              <span style={{ color: 'var(--fg-muted)', flexShrink: 0, marginTop: 1 }}><I.Truck size={14} /></span>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
                Ao enviar, o pedido vai por email ao fornecedor e fica em aberto. Quando a mercadoria chegar,
                a entrada de estoque já vem pré-preenchida com estes itens.
              </div>
            </div>
          </div>
        </div>
      </Page>
    </StoreShell>
  );
}

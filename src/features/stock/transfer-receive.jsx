"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Page } from '@/components/ui/page-container';
import { MovementNav } from '@/features/stock/movement-nav';
import { I } from '@/components/icons';
import { ProductThumb } from '@/components/ui/product-thumb';
import { CategoryBadge } from '@/components/ui/category-badge';
import { AttrChip } from '@/components/ui/attr-chip';
import { variantLabel } from '@/lib/attr-colors';
import { TextInput } from '@/components/ui/text-input';
import { FormCard } from '@/components/ui/form-card';
import { Field } from '@/components/ui/field';
import { SelectInput } from '@/components/ui/select-input';
import { TextareaInput } from '@/components/ui/textarea-input';
import { SummaryRow } from '@/components/ui/summary-row';
import { EmptyState } from '@/components/ui/empty-state';
import { transferReceiveAction } from '@/features/stock/actions';

const REASONS = ['Item não localizado na caixa', 'Item danificado no transporte', 'Volume chegou aberto', 'Divergência na nota de envio', 'Item extra não listado'];

export function TransferReceive({ transfer }) {
  const navigate = useNavigate();

  if (!transfer) {
    return (
      <StoreShell route="/stock/transfer/receive" breadcrumb={['Estoque', 'Receber transferência']} navigate={navigate}>
        <PageHeader title="Receber transferência" />
        <Page>
          <MovementNav route="/stock/transfer" navigate={navigate} />
          <EmptyState
            icon={<I.Swap size={18} />}
            title="Nenhuma transferência pendente de conferência"
            desc="Quando uma unidade despachar mercadoria pra cá, ela aparece aqui pra você conferir item a item."
            action={<button onClick={() => navigate('/stock/transfer')} className="btn btn-primary btn-sm">Nova transferência</button>}
          />
        </Page>
      </StoreShell>
    );
  }

  return <TransferReceiveForm transfer={transfer} navigate={navigate} />;
}

function TransferReceiveForm({ transfer, navigate }) {
  const [lines, setLines] = React.useState(() => transfer.transfer_items.map((ti) => ({
    id: ti.id, sku: ti.product.sku, name: ti.product.name, category: ti.product.category, attrs: ti.product.attrs,
    sent: ti.qty_sent, got: ti.qty_sent,
  })));
  const [reason, setReason] = React.useState(REASONS[0]);
  const [detail, setDetail] = React.useState('');
  const [error, setError] = React.useState('');
  const [pending, startTransition] = React.useTransition();
  const setGot = (i, v) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, got: v } : l)));

  const totalSent = lines.reduce((s, l) => s + l.sent, 0);
  const totalGot = lines.reduce((s, l) => s + l.got, 0);
  const diverging = lines.filter((l) => l.got !== l.sent);
  const hasDivergence = diverging.length > 0;

  const submit = () => {
    setError('');
    if (hasDivergence && detail.trim().length < 10) { setError('Detalhe o que foi verificado na divergência.'); return; }
    startTransition(async () => {
      const result = await transferReceiveAction({
        transferId: transfer.id,
        items: lines.map((l) => ({ transferItemId: l.id, qtyReceived: l.got })),
        discrepancyReason: hasDivergence ? reason : '',
        discrepancyDetail: hasDivergence ? detail : '',
      });
      if (result?.error) { setError(result.error); return; }
      navigate('/stock/history');
    });
  };

  return (
    <StoreShell route="/stock/transfer/receive" breadcrumb={['Estoque', 'Receber transferência']} navigate={navigate}>
      <PageHeader
        title="Receber transferência"
        sub={`De ${transfer.origin.name} · ${lines.length} SKU${lines.length === 1 ? '' : 's'} · ${totalSent} itens`}
        actions={<button onClick={() => navigate('/stock/history')} className="btn btn-ghost btn-sm">Conferir depois</button>}
      />
      <Page>
        <MovementNav route="/stock/transfer" navigate={navigate} />

        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '11px 14px', background: 'var(--accent-soft)',
          border: '1px solid var(--accent)', borderRadius: 8, fontSize: 12,
        }}>
          <span style={{ color: 'var(--accent-text)', flexShrink: 0 }}><I.Swap size={15} /></span>
          <span style={{ color: 'var(--fg)', flex: 1, lineHeight: 1.5 }}>
            O saldo só entra em <strong>{transfer.destination.name}</strong> depois desta conferência. Enquanto estiver pendente,
            os itens aparecem como <strong>em trânsito</strong> e não podem ser vendidos em nenhuma unidade.
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 16, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Conferência item a item</h3>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Informe o que efetivamente chegou. Divergências ficam registradas nas duas unidades.</p>
                </div>
                <button onClick={() => setLines((ls) => ls.map((l) => ({ ...l, got: l.sent })))} className="btn btn-outline btn-sm">
                  <I.Check size={12} /> Conferir tudo como enviado
                </button>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Produto</th><th>Categoria</th><th>Variação</th>
                    <th className="num">Enviado</th><th style={{ width: 120 }}>Recebido</th><th className="num">Diferença</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, i) => {
                    const diff = l.got - l.sent;
                    return (
                      <tr key={l.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <ProductThumb category={l.category} attrs={l.attrs} size={26} />
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 500 }}>{l.name}</div>
                              <div style={{ fontSize: 10, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{l.sku}</div>
                            </div>
                          </div>
                        </td>
                        <td>{l.category && <CategoryBadge category={l.category} />}</td>
                        <td><AttrChip value={variantLabel(l.attrs || {})} /></td>
                        <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{l.sent}</td>
                        <td>
                          <TextInput mono type="number" value={l.got} onChange={(e) => setGot(i, +e.target.value || 0)} style={{ height: 28 }} />
                        </td>
                        <td className="num">
                          <span style={{
                            fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: diff ? 600 : 400,
                            color: diff === 0 ? 'var(--success)' : diff < 0 ? 'var(--danger)' : 'var(--warning)',
                          }}>{diff === 0 ? 'OK' : (diff > 0 ? '+' : '') + diff}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {hasDivergence && (
              <FormCard title="Justificativa da divergência" desc="Obrigatória — abre uma ocorrência para a unidade de origem." cols={1}>
                <Field label="Motivo" required>
                  <SelectInput value={reason} onChange={setReason} options={REASONS} />
                </Field>
                <Field label="Detalhamento" required hint="Descreva o estado do volume e o que foi conferido.">
                  <TextareaInput value={detail} onChange={(e) => setDetail(e.target.value)} style={{ minHeight: 72 }} placeholder="Ex.: caixa 2 de 3 chegou com fita rompida, faltou 1 unidade." />
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
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 10 }}>Resumo da conferência</div>
              <SummaryRow label="SKUs na remessa" value={`${lines.length}`} />
              <SummaryRow label="Itens enviados" value={`${totalSent}`} />
              <SummaryRow label="Itens recebidos" value={`${totalGot}`} />
              <div style={{ borderTop: '1px solid var(--line)', marginTop: 8, paddingTop: 8 }}>
                <SummaryRow
                  label={hasDivergence ? `Divergência em ${diverging.length} SKU(s)` : 'Sem divergência'}
                  value={totalGot === totalSent ? 'OK' : (totalGot - totalSent > 0 ? '+' : '') + (totalGot - totalSent)}
                  strong tone={totalGot === totalSent ? 'success' : 'danger'}
                />
              </div>
            </div>

            <button onClick={submit} disabled={pending} className="btn btn-primary btn-lg" style={{ justifyContent: 'center', width: '100%', opacity: pending ? 0.7 : 1 }}>
              {pending ? 'Confirmando…' : hasDivergence ? 'Confirmar com divergência' : 'Confirmar recebimento'}
            </button>
            <button onClick={() => navigate('/stock')} className="btn btn-ghost" style={{ justifyContent: 'center', width: '100%' }}>Cancelar</button>
          </div>
        </div>
      </Page>
    </StoreShell>
  );
}

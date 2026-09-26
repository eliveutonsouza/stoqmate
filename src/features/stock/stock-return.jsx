"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { MovementPage } from '@/features/stock/movement-page';
import { SummaryRow } from '@/components/ui/summary-row';
import { brl } from '@/lib/format';
import { FormCard } from '@/components/ui/form-card';
import { ProductPicker } from '@/components/ui/product-picker';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { SelectInput } from '@/components/ui/select-input';
import { TextareaInput } from '@/components/ui/textarea-input';
import { I } from '@/components/icons';
import { useDefaultStoreId } from '@/components/layout/shell-context';
import { stockReturnAction } from '@/features/stock/actions';

const REASONS = ['Desistência do cliente', 'Defeito de fabricação', 'Variação incorreta', 'Produto errado entregue', 'Arrependimento (7 dias)'];

export function StockReturn({ stores, initialProduct, initialStoreId, initialQty }) {
  const navigate = useNavigate();
  const defaultStoreId = useDefaultStoreId(stores);
  const [storeId, setStoreId] = React.useState(initialStoreId ?? defaultStoreId);
  const [product, setProduct] = React.useState(initialProduct ?? null);
  const [qty, setQty] = React.useState(initialQty ?? 1);
  const [reason, setReason] = React.useState(REASONS[0]);
  const [restock, setRestock] = React.useState(true);
  const [notes, setNotes] = React.useState('');
  const [error, setError] = React.useState('');
  const [pending, startTransition] = React.useTransition();

  const stock = (product?.stock_balances || []).find((b) => b.store_id === storeId)?.qty ?? 0;
  const refund = product ? qty * product.sale_price : 0;
  const canSave = product && storeId && qty > 0;

  const submit = () => {
    setError('');
    if (!product) { setError('Selecione um produto.'); return; }
    startTransition(async () => {
      const result = await stockReturnAction({ storeId, productId: product.id, qty, reason, restock, notes });
      if (result?.error) { setError(result.error); return; }
      navigate('/stock/history');
    });
  };

  return (
    <MovementPage
      route="/stock/return" navigate={navigate}
      title="Registrar devolução"
      sub="O item volta ao estoque (se aplicável) e fica registrado no histórico de movimentações."
      submitLabel={pending ? 'Confirmando…' : 'Confirmar devolução'}
      onSubmit={submit}
      submitDisabled={!canSave || pending}
      aside={(
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 10 }}>Resumo da devolução</div>
          <SummaryRow label="Itens devolvidos" value={`${qty}`} />
          {product && <SummaryRow label="Valor unitário" value={brl(product.sale_price)} />}
          <div style={{ borderTop: '1px solid var(--line)', marginTop: 8, paddingTop: 8 }}>
            <SummaryRow label="Valor a estornar" value={brl(refund)} strong tone="warning" />
          </div>
          {product && (
            <div style={{ borderTop: '1px solid var(--line)', marginTop: 12, paddingTop: 12 }}>
              <SummaryRow label="Estoque antes" value={`${stock}`} />
              <SummaryRow label="Estoque depois" value={`${restock ? stock + qty : stock}`} tone={restock ? 'success' : undefined} />
              {!restock && <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 6 }}>Item vai para avaria, sem retorno ao estoque vendável.</div>}
            </div>
          )}
          {error && (
            <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 7, fontSize: 12, color: 'var(--fg)' }}>
              {error}
            </div>
          )}
        </div>
      )}
    >
      <FormCard title="Produto devolvido" cols={1}>
        <ProductPicker product={product} storeId={storeId} onSelect={setProduct} onClear={() => setProduct(null)} />
      </FormCard>

      <FormCard title="Detalhes da devolução" cols={2}>
        <Field label="Unidade" required span={1}>
          <SelectInput value={storeId} onChange={setStoreId} options={stores.map((s) => ({ value: s.id, label: s.name }))} />
        </Field>
        <Field label="Quantidade" required span={1}>
          <TextInput mono type="number" value={qty} onChange={(e) => setQty(+e.target.value || 0)} />
        </Field>
        <Field label="Motivo" required span={2} hint="Alimenta o relatório de qualidade por fornecedor.">
          <SelectInput value={reason} onChange={setReason} options={REASONS} />
        </Field>
        <Field label="Observações" span={2}>
          <TextareaInput value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex.: cliente apresentou nota fiscal, produto sem uso." />
        </Field>
      </FormCard>

      <FormCard title="Destino do item" cols={1}>
        {[
          { k: true, t: 'Retornar ao estoque vendável', d: 'Item em condição de revenda. O saldo aumenta.' },
          { k: false, t: 'Enviar para avaria', d: 'Item danificado. Sai do estoque vendável e entra no controle de perdas.' },
        ].map(o => (
          <button key={String(o.k)} onClick={() => setRestock(o.k)} style={{
            display: 'flex', gap: 11, alignItems: 'flex-start', textAlign: 'left',
            padding: '11px 13px',
            border: '1px solid ' + (restock === o.k ? 'var(--accent)' : 'var(--line)'),
            background: restock === o.k ? 'var(--accent-soft)' : 'var(--bg-elev)',
            borderRadius: 7, width: '100%',
          }}>
            <span style={{
              width: 14, height: 14, borderRadius: '50%', flexShrink: 0, marginTop: 2,
              border: '1px solid ' + (restock === o.k ? 'var(--accent)' : 'var(--line-strong)'),
              background: restock === o.k ? 'var(--accent-strong)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
            }}>{restock === o.k && <I.Check size={9} stroke={3} />}</span>
            <span>
              <span style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--fg)' }}>{o.t}</span>
              <span style={{ display: 'block', fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>{o.d}</span>
            </span>
          </button>
        ))}
      </FormCard>
    </MovementPage>
  );
}

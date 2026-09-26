"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { MovementPage } from '@/features/stock/movement-page';
import { SummaryRow } from '@/components/ui/summary-row';
import { FormCard } from '@/components/ui/form-card';
import { ProductPicker } from '@/components/ui/product-picker';
import { Field } from '@/components/ui/field';
import { SelectInput } from '@/components/ui/select-input';
import { TextInput } from '@/components/ui/text-input';
import { TextareaInput } from '@/components/ui/textarea-input';
import { I } from '@/components/icons';
import { useDefaultStoreId } from '@/components/layout/shell-context';
import { transferDispatchAction } from '@/features/stock/actions';

const REASONS = ['Reposição por ruptura no destino', 'Balanceamento de estoque', 'Remanejamento sazonal', 'Devolução ao centro de distribuição', 'Pedido de cliente em outra loja'];

export function StockTransfer({ stores, initialProduct, pendingCount = 0 }) {
  const navigate = useNavigate();
  const [product, setProduct] = React.useState(initialProduct ?? null);
  const defaultStoreId = useDefaultStoreId(stores);
  const [originId, setOriginId] = React.useState(defaultStoreId);
  const [destId, setDestId] = React.useState(stores[1]?.id ?? '');
  const [qty, setQty] = React.useState(1);
  const [reason, setReason] = React.useState(REASONS[0]);
  const [carrier, setCarrier] = React.useState('Malha interna');
  const [notes, setNotes] = React.useState('');
  const [error, setError] = React.useState('');
  const [pending, startTransition] = React.useTransition();

  const originStock = (product?.stock_balances || []).find((b) => b.store_id === originId)?.qty ?? 0;
  const destStock = (product?.stock_balances || []).find((b) => b.store_id === destId)?.qty ?? 0;
  const insufficient = product ? qty > originStock : false;
  const destOptions = stores.filter((s) => s.id !== originId);
  const canSave = product && originId && destId && originId !== destId && qty > 0 && !insufficient;

  const submit = () => {
    setError('');
    if (!product) { setError('Selecione um produto.'); return; }
    if (originId === destId) { setError('Origem e destino precisam ser lojas diferentes.'); return; }
    if (insufficient) { setError('Saldo insuficiente na origem.'); return; }
    startTransition(async () => {
      const result = await transferDispatchAction({
        originStoreId: originId, destinationStoreId: destId,
        items: [{ productId: product.id, qty }], reason, carrier, notes,
      });
      if (result?.error) { setError(result.error); return; }
      navigate('/stock/history');
    });
  };

  return (
    <MovementPage
      route="/stock/transfer" navigate={navigate}
      title="Transferência entre lojas"
      sub="Um lançamento, duas movimentações: saída da origem e entrada no destino."
      submitLabel={pending ? 'Confirmando…' : insufficient ? 'Saldo insuficiente na origem' : 'Confirmar transferência'}
      onSubmit={submit}
      submitDisabled={!canSave || pending}
      aside={(
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 10 }}>Resumo da transferência</div>
          <SummaryRow label="Unidades movidas" value={`${qty}`} strong />
          {product && (
            <>
              <div style={{ borderTop: '1px solid var(--line)', marginTop: 12, paddingTop: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginBottom: 6 }}>Origem</div>
                <SummaryRow label="Antes" value={`${originStock}`} />
                <SummaryRow label="Depois" value={`${Math.max(originStock - qty, 0)}`} tone={insufficient ? 'danger' : 'warning'} />
              </div>
              <div style={{ borderTop: '1px solid var(--line)', marginTop: 12, paddingTop: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginBottom: 6 }}>Destino</div>
                <SummaryRow label="Antes" value={`${destStock}`} />
                <SummaryRow label="Depois (após conferência)" value={`${destStock + qty}`} tone="success" />
              </div>
            </>
          )}
          {error && (
            <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 7, fontSize: 12, color: 'var(--fg)' }}>
              {error}
            </div>
          )}
        </div>
      )}
    >
      {pendingCount > 0 && (
        <div className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--warning-soft)' }}>
          <I.Swap size={14} />
          <span style={{ flex: 1, fontSize: 12.5 }}>
            {pendingCount === 1 ? '1 transferência aguarda' : `${pendingCount} transferências aguardam`} conferência no destino.
          </span>
          <button type="button" onClick={() => navigate('/stock/transfer/receive')} className="btn btn-outline btn-sm">Receber transferência</button>
        </div>
      )}
      <FormCard title="Produto" cols={1}>
        <ProductPicker product={product} storeId={originId} onSelect={setProduct} onClear={() => setProduct(null)} />
      </FormCard>

      <FormCard title="Origem e destino" cols={2}>
        <Field label="Unidade de origem" required span={1} hint={`Saldo atual: ${originStock}.`}>
          <SelectInput value={originId} onChange={setOriginId} options={stores.map((s) => ({ value: s.id, label: s.name }))} />
        </Field>
        <Field label="Unidade de destino" required span={1} hint={`Saldo atual: ${destStock}.`}>
          <SelectInput value={destId} onChange={setDestId} options={destOptions.map((s) => ({ value: s.id, label: s.name }))} />
        </Field>
        <Field label="Quantidade" required span={1} error={insufficient ? 'Acima do saldo da unidade de origem.' : null}>
          <TextInput mono type="number" value={qty} onChange={(e) => setQty(+e.target.value || 0)} />
        </Field>
        <Field label="Motivo" required span={2}>
          <SelectInput value={reason} onChange={setReason} options={REASONS} />
        </Field>
        <Field label="Transportadora" span={1}>
          <SelectInput value={carrier} onChange={setCarrier} options={['Malha interna', 'Transportadora parceira', 'Retirada no local']} />
        </Field>
        <Field label="Observações" span={2}>
          <TextareaInput value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex.: enviar junto com a remessa semanal de sexta-feira." />
        </Field>
      </FormCard>

      <div style={{ padding: '12px 14px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 8, display: 'flex', gap: 11, alignItems: 'flex-start' }}>
        <span style={{ color: 'var(--fg-muted)', flexShrink: 0, marginTop: 1 }}><I.Swap size={15} /></span>
        <div style={{ fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.55 }}>
          O destino recebe a mercadoria como <strong style={{ color: 'var(--fg)', fontWeight: 500 }}>pendente de conferência</strong>.
          O saldo só entra lá quando alguém confirma o recebimento — divergências ficam registradas nas duas pontas.
        </div>
      </div>
    </MovementPage>
  );
}

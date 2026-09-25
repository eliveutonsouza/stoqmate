"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { MovementPage } from '@/features/stock/movement-page';
import { SummaryRow } from '@/components/ui/summary-row';
import { brl } from '@/lib/format';
import { FormCard } from '@/components/ui/form-card';
import { ProductPicker } from '@/components/ui/product-picker';
import { I } from '@/components/icons';
import { useDefaultStoreId } from '@/components/layout/shell-context';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { SelectInput } from '@/components/ui/select-input';
import { TextareaInput } from '@/components/ui/textarea-input';
import { stockExchangeAction } from '@/features/stock/actions';

const REASONS = ['Variação incorreta', 'Cor diferente da desejada', 'Defeito de fabricação', 'Desistência do cliente', 'Presente trocado'];

export function StockExchange({ stores }) {
  const navigate = useNavigate();
  const defaultStoreId = useDefaultStoreId(stores);
  const [storeId, setStoreId] = React.useState(defaultStoreId);
  const [returned, setReturned] = React.useState(null);
  const [delivered, setDelivered] = React.useState(null);
  const [qty, setQty] = React.useState(1);
  const [reason, setReason] = React.useState(REASONS[0]);
  const [notes, setNotes] = React.useState('');
  const [error, setError] = React.useState('');
  const [pending, startTransition] = React.useTransition();

  const returnedStock = (returned?.stock_balances || []).find((b) => b.store_id === storeId)?.qty ?? 0;
  const deliveredStock = (delivered?.stock_balances || []).find((b) => b.store_id === storeId)?.qty ?? 0;
  const insufficient = delivered ? qty > deliveredStock : false;
  const diff = delivered && returned ? (delivered.sale_price - returned.sale_price) * qty : 0;
  const canSave = returned && delivered && returned.id !== delivered.id && qty > 0 && !insufficient;

  const submit = () => {
    setError('');
    if (!returned || !delivered) { setError('Selecione os dois itens da troca.'); return; }
    if (returned.id === delivered.id) { setError('Os itens da troca precisam ser diferentes.'); return; }
    if (insufficient) { setError('Saldo insuficiente do item entregue.'); return; }
    startTransition(async () => {
      const result = await stockExchangeAction({
        storeId, returnedProductId: returned.id, deliveredProductId: delivered.id,
        qty, reason, notes,
      });
      if (result?.error) { setError(result.error); return; }
      navigate('/stock/history');
    });
  };

  return (
    <MovementPage
      route="/stock/exchange" navigate={navigate}
      title="Registrar troca"
      sub="Gera duas movimentações: entrada do item devolvido e saída do item entregue."
      submitLabel={pending ? 'Confirmando…' : insufficient ? 'Saldo insuficiente' : 'Confirmar troca'}
      onSubmit={submit}
      submitDisabled={!canSave || pending}
      aside={(
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 10 }}>Resumo da troca</div>
          <SummaryRow label="Itens trocados" value={`${qty}`} />
          {returned && <SummaryRow label="Valor do item devolvido" value={brl(returned.sale_price * qty)} />}
          {delivered && <SummaryRow label="Valor do item entregue" value={brl(delivered.sale_price * qty)} />}
          {returned && delivered && (
            <div style={{ borderTop: '1px solid var(--line)', marginTop: 8, paddingTop: 8 }}>
              <SummaryRow
                label={diff > 0 ? 'Cliente paga a diferença' : diff < 0 ? 'Loja devolve a diferença' : 'Sem diferença'}
                value={brl(Math.abs(diff))} strong
                tone={diff > 0 ? 'success' : diff < 0 ? 'warning' : undefined}
              />
            </div>
          )}
          {(returned || delivered) && (
            <div style={{ borderTop: '1px solid var(--line)', marginTop: 12, paddingTop: 12 }}>
              {returned && <SummaryRow label="Devolvido depois" value={`${returnedStock + qty}`} tone="success" />}
              {delivered && <SummaryRow label="Entregue depois" value={`${Math.max(deliveredStock - qty, 0)}`} tone={insufficient ? 'danger' : 'warning'} />}
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
      <FormCard title="Item devolvido pelo cliente" desc="Volta para o estoque na confirmação." cols={1}>
        <ProductPicker product={returned} storeId={storeId} onSelect={setReturned} onClear={() => setReturned(null)} />
      </FormCard>

      <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--fg-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, padding: '4px 12px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 100 }}>
          <I.ArrowDown size={13} /> troca por
        </div>
      </div>

      <FormCard title="Item entregue ao cliente" desc="Sai do estoque na confirmação." cols={1}>
        <ProductPicker product={delivered} storeId={storeId} onSelect={setDelivered} onClear={() => setDelivered(null)} />
      </FormCard>

      <FormCard title="Detalhes" cols={2}>
        <Field label="Unidade" required span={1}>
          <SelectInput value={storeId} onChange={setStoreId} options={stores.map((s) => ({ value: s.id, label: s.name }))} />
        </Field>
        <Field label="Quantidade" required span={1}>
          <TextInput mono type="number" value={qty} onChange={(e) => setQty(+e.target.value || 0)} />
        </Field>
        <Field label="Motivo da troca" required span={2}>
          <SelectInput value={reason} onChange={setReason} options={REASONS} />
        </Field>
        <Field label="Observações" span={2}>
          <TextareaInput value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex.: item devolvido sem sinais de uso, embalagem original." />
        </Field>
      </FormCard>
    </MovementPage>
  );
}

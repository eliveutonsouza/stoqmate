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
import { stockEntryAction } from '@/features/stock/actions';

export function StockEntry({ stores, suppliers, locations }) {
  const navigate = useNavigate();
  const [product, setProduct] = React.useState(null);
  const defaultStoreId = useDefaultStoreId(stores);
  const [storeId, setStoreId] = React.useState(defaultStoreId);
  const [qty, setQty] = React.useState(1);
  const [unit, setUnit] = React.useState(0);
  const [supplierId, setSupplierId] = React.useState('');
  const [locationId, setLocationId] = React.useState('');
  const [invoice, setInvoice] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [error, setError] = React.useState('');
  const [pending, startTransition] = React.useTransition();

  const currentStock = (product?.stock_balances || []).find((b) => b.store_id === storeId)?.qty ?? 0;
  const total = qty * unit;
  const canSave = product && qty > 0 && unit > 0 && storeId;

  const submit = () => {
    setError('');
    if (!canSave) { setError('Selecione um produto, uma unidade e informe quantidade e custo.'); return; }
    startTransition(async () => {
      const result = await stockEntryAction({
        storeId, productId: product.id, qty, unitCost: unit,
        notes: [invoice && `NF ${invoice}`, notes].filter(Boolean).join(' — '), locationId,
      });
      if (result?.error) { setError(result.error); return; }
      // Entrada já gravada: avisa e segue pro histórico só depois que a pessoa leu.
      if (result?.warning) { setError(result.warning); setTimeout(() => navigate('/stock/history'), 2500); return; }
      navigate('/stock/history');
    });
  };

  return (
    <MovementPage
      route="/stock/entry" navigate={navigate}
      title="Entrada de estoque"
      sub="Registre a compra recebida do fornecedor. O saldo desta unidade sobe na confirmação."
      submitLabel={pending ? 'Confirmando…' : 'Confirmar entrada'}
      onSubmit={submit}
      submitDisabled={!canSave || pending}
      aside={(
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 10 }}>Resumo da entrada</div>
          <SummaryRow label="Unidades recebidas" value={`${qty}`} />
          <SummaryRow label="Custo unitário" value={brl(unit)} />
          <div style={{ borderTop: '1px solid var(--line)', marginTop: 8, paddingTop: 8 }}>
            <SummaryRow label="Total da nota" value={brl(total)} strong />
          </div>
          {product && (
            <div style={{ borderTop: '1px solid var(--line)', marginTop: 12, paddingTop: 12 }}>
              <SummaryRow label="Estoque antes" value={`${currentStock}`} />
              <SummaryRow label="Estoque depois" value={`${currentStock + qty}`} tone="success" />
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
      <FormCard title="Produto" desc="Busque pelo SKU, código de barras ou nome." cols={1}>
        <ProductPicker product={product} storeId={storeId} onSelect={setProduct} onClear={() => setProduct(null)} />
      </FormCard>

      <FormCard title="Dados da compra" cols={3}>
        <Field label="Quantidade" required span={1}>
          <TextInput mono type="number" value={qty} onChange={(e) => setQty(+e.target.value || 0)} />
        </Field>
        <Field label="Preço de compra unitário" required span={1}>
          <TextInput mono prefix="R$" type="number" value={unit} onChange={(e) => setUnit(+e.target.value || 0)} />
        </Field>
        <Field label="Fornecedor" span={1}>
          <SelectInput value={supplierId} onChange={setSupplierId} options={suppliers.map((s) => ({ value: s.id, label: s.name }))} placeholder="Selecione…" />
        </Field>
        <Field label="Nota fiscal" span={1}>
          <TextInput mono value={invoice} onChange={(e) => setInvoice(e.target.value)} placeholder="8421" />
        </Field>
        <Field label="Destino" span={1} hint="Unidade que recebe a mercadoria.">
          <SelectInput value={storeId} onChange={setStoreId} options={stores.map((s) => ({ value: s.id, label: s.name }))} />
        </Field>
        <Field label="Local de estoque" span={1}>
          <SelectInput value={locationId} onChange={setLocationId} options={locations.map((l) => ({ value: l.id, label: l.code }))} placeholder="Selecione…" />
        </Field>
        <Field label="Observações" span={3}>
          <TextareaInput value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex.: duas caixas chegaram amassadas, conteúdo conferido e aceito." />
        </Field>
      </FormCard>

      <div style={{ padding: '12px 14px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 8, display: 'flex', gap: 10, alignItems: 'center' }}>
        <span style={{ color: 'var(--fg-muted)' }}><I.Truck size={15} /></span>
        <div style={{ fontSize: 12, color: 'var(--fg-muted)', flex: 1 }}>
          Recebeu vários SKUs na mesma nota? Leia o XML da NF-e e lance tudo de uma vez.
        </div>
        <button disabled title="Em breve" className="btn btn-outline btn-sm" style={{ opacity: 0.55, cursor: 'not-allowed' }}>Importar XML da NF-e</button>
      </div>
    </MovementPage>
  );
}

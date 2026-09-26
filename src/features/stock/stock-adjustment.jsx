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
import { stockAdjustmentAction } from '@/features/stock/actions';

const REASONS = ['Erro de lançamento anterior', 'Furto / extravio', 'Item danificado descartado', 'Venda não registrada', 'Devolução não registrada', 'Transferência não confirmada', 'Contagem anterior incorreta'];

export function StockAdjustment({ stores }) {
  const navigate = useNavigate();
  const [product, setProduct] = React.useState(null);
  const defaultStoreId = useDefaultStoreId(stores);
  const [storeId, setStoreId] = React.useState(defaultStoreId);
  const [real, setReal] = React.useState(0);
  const [reason, setReason] = React.useState(REASONS[0]);
  const [justification, setJustification] = React.useState('');
  const [error, setError] = React.useState('');
  const [pending, startTransition] = React.useTransition();

  const balanceOf = (p, store) => (p?.stock_balances || []).find((b) => b.store_id === store)?.qty ?? 0;
  const system = balanceOf(product, storeId);
  // A contagem parte do saldo do sistema: sem isso a tela abria mostrando
  // "falta" de todo o estoque antes de qualquer contagem.
  const pickProduct = (p) => { setProduct(p); setReal(balanceOf(p, storeId)); };
  const pickStore = (store) => { setStoreId(store); setReal(balanceOf(product, store)); };
  const diff = real - system;
  const lossValue = Math.abs(diff) * (product?.cost_price ?? 0);
  const canSave = product && storeId && diff !== 0 && justification.trim().length >= 20;

  const submit = () => {
    setError('');
    if (!product) { setError('Selecione um produto.'); return; }
    if (diff === 0) { setError('Sem divergência — nada para ajustar.'); return; }
    if (justification.trim().length < 20) { setError('Detalhe a justificativa em pelo menos 20 caracteres.'); return; }
    startTransition(async () => {
      const result = await stockAdjustmentAction({ storeId, productId: product.id, countedQty: real, reason, justification });
      if (result?.error) { setError(result.error); return; }
      navigate('/stock/history');
    });
  };

  return (
    <MovementPage
      route="/stock/adjustment" navigate={navigate}
      title="Ajuste de inventário"
      sub="Alinhe o saldo do sistema com a contagem física. Toda divergência exige justificativa."
      submitLabel={pending ? 'Confirmando…' : 'Confirmar ajuste'}
      onSubmit={submit}
      submitDisabled={!canSave || pending}
      aside={(
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 10 }}>Resultado do ajuste</div>
          <SummaryRow label="Saldo no sistema" value={`${system}`} />
          <SummaryRow label="Contagem física" value={`${real}`} />
          <div style={{ borderTop: '1px solid var(--line)', marginTop: 8, paddingTop: 8 }}>
            <SummaryRow
              label={diff === 0 ? 'Sem divergência' : diff > 0 ? 'Sobra encontrada' : 'Falta encontrada'}
              value={(diff > 0 ? '+' : '') + diff}
              strong
              tone={diff === 0 ? 'success' : diff > 0 ? 'warning' : 'danger'}
            />
          </div>
          {diff !== 0 && product && product.cost_price != null && (
            <div style={{ borderTop: '1px solid var(--line)', marginTop: 12, paddingTop: 12 }}>
              <SummaryRow label={diff < 0 ? 'Valor da perda' : 'Valor da sobra'} value={brl(lossValue)} tone={diff < 0 ? 'danger' : undefined} />
              <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 6, lineHeight: 1.5 }}>
                Calculado pelo preço de compra ({brl(product.cost_price ?? 0)}).
              </div>
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
      <FormCard title="Produto conferido" cols={1}>
        <ProductPicker product={product} storeId={storeId} onSelect={pickProduct} onClear={() => { setProduct(null); setReal(0); }} />
      </FormCard>

      <FormCard title="Contagem" cols={3}>
        <Field label="Unidade" span={1}>
          <SelectInput value={storeId} onChange={pickStore} options={stores.map((s) => ({ value: s.id, label: s.name }))} />
        </Field>
        <Field label="Saldo no sistema" span={1} hint="Calculado pelo histórico.">
          <TextInput mono value={system} readOnly style={{ background: 'var(--bg-sunken)' }} />
        </Field>
        <Field label="Contagem física" required span={1} hint="O que você contou no local.">
          <TextInput mono type="number" value={real} onChange={(e) => setReal(+e.target.value || 0)} />
        </Field>
        <Field label="Diferença" span={1}>
          <TextInput mono value={(diff > 0 ? '+' : '') + diff} readOnly style={{
            background: 'var(--bg-sunken)',
            color: diff === 0 ? 'var(--fg)' : diff > 0 ? 'var(--warning)' : 'var(--danger)',
            fontWeight: 600,
          }} />
        </Field>
      </FormCard>

      <FormCard title="Justificativa" desc="Obrigatória sempre que houver divergência. Fica registrada no log de auditoria." cols={1}>
        <Field label="Motivo da divergência" required>
          <SelectInput value={reason} onChange={setReason} options={REASONS} />
        </Field>
        <Field label="Detalhamento" required hint="Descreva o que foi verificado. Mínimo 20 caracteres.">
          <TextareaInput value={justification} onChange={(e) => setJustification(e.target.value)} style={{ minHeight: 84 }} placeholder="Ex.: conferência completa do local A-04, duas unidades não localizadas." />
        </Field>
      </FormCard>

      {diff !== 0 && (
        <div style={{
          display: 'flex', gap: 11, alignItems: 'flex-start',
          padding: '12px 14px',
          background: diff < 0 ? 'var(--danger-soft)' : 'var(--warning-soft)',
          border: '1px solid ' + (diff < 0 ? 'var(--danger)' : 'var(--warning)'),
          borderRadius: 8,
        }}>
          <span style={{ color: diff < 0 ? 'var(--danger)' : 'var(--warning)', flexShrink: 0, marginTop: 1 }}><I.Alert size={15} /></span>
          <div style={{ fontSize: 12, color: 'var(--fg)', lineHeight: 1.55 }}>
            Este ajuste {diff < 0 ? 'baixa' : 'sobe'} <strong>{Math.abs(diff)} unidades</strong> e não pode ser desfeito —
            apenas corrigido por um novo ajuste. O gestor financeiro é notificado de divergências acima de {brl(200)}.
          </div>
        </div>
      )}
    </MovementPage>
  );
}

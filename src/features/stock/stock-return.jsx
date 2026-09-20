"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { catById } from '@/lib/mock';
import { PICK } from '@/features/stock/pick';
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

export function StockReturn() {
  const navigate = useNavigate();
  const [qty, setQty] = React.useState(1);
  const [restock, setRestock] = React.useState(true);
  const c = catById(PICK.cat);
  const refund = qty * PICK.sale;
  return (
    <MovementPage
      route="/stock/return" navigate={navigate}
      title="Registrar devolução"
      sub="O item volta ao estoque e o valor entra como estorno no relatório de vendas."
      submitLabel="Confirmar devolução"
      aside={(
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 10 }}>Resumo da devolução</div>
          <SummaryRow label="Itens devolvidos" value={`${qty}`} />
          <SummaryRow label="Valor unitário" value={brl(PICK.sale)} />
          <div style={{ borderTop: '1px solid var(--line)', marginTop: 8, paddingTop: 8 }}>
            <SummaryRow label="Valor a estornar" value={brl(refund)} strong tone="warning" />
          </div>
          <div style={{ borderTop: '1px solid var(--line)', marginTop: 12, paddingTop: 12 }}>
            <SummaryRow label="Estoque antes" value={`${PICK.stock} ${c.unitPlural}`} />
            <SummaryRow label="Estoque depois" value={`${restock ? PICK.stock + qty : PICK.stock} ${c.unitPlural}`} tone={restock ? 'success' : undefined} />
            {!restock && <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 6 }}>Item vai para avaria, sem retorno ao estoque vendável.</div>}
          </div>
        </div>
      )}
    >
      <FormCard title="Produto devolvido" cols={1}>
        <ProductPicker product={PICK} onClear={() => {}} />
      </FormCard>

      <FormCard title="Detalhes da devolução" cols={2}>
        <Field label="Quantidade" required span={1}>
          <TextInput mono type="number" value={qty} onChange={(e) => setQty(+e.target.value || 0)} suffix={c.unit === 'unidade' ? 'un' : c.unit} />
        </Field>
        <Field label="Data da devolução" required span={1}>
          <TextInput type="date" defaultValue="2026-09-18" />
        </Field>
        <Field label="Motivo" required span={2} hint="Obrigatório — alimenta o relatório de qualidade por fornecedor.">
          <SelectInput value="Desistência do cliente" onChange={() => {}}
            options={['Desistência do cliente', 'Defeito de fabricação', 'Variação incorreta', 'Produto errado entregue', 'Arrependimento (7 dias)']} />
        </Field>
        <Field label="Venda de origem" span={1}>
          <TextInput mono defaultValue="#4198" />
        </Field>
        <Field label="Forma de estorno" span={1}>
          <SelectInput value="Mesmo meio de pagamento" onChange={() => {}} options={['Mesmo meio de pagamento', 'Dinheiro', 'Crédito em loja', 'Troca por outro produto']} />
        </Field>
        <Field label="Observações" span={2}>
          <TextareaInput placeholder="Ex.: cliente apresentou nota fiscal, produto sem uso." />
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

// === Adjustment ===

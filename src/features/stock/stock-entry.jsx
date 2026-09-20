"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { MOCK, catById } from '@/lib/mock';
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

export function StockEntry() {
  const navigate = useNavigate();
  const [qty, setQty] = React.useState(48);
  const [unit, setUnit] = React.useState(158);
  const c = catById(PICK.cat);
  const total = qty * unit;
  return (
    <MovementPage
      route="/stock/entry" navigate={navigate}
      title="Entrada de estoque"
      sub="Registre a compra recebida do fornecedor. O saldo desta unidade sobe na confirmação."
      submitLabel="Confirmar entrada"
      aside={(
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 10 }}>Resumo da entrada</div>
          <SummaryRow label={`${c.unitPlural} recebidos`} value={`${qty}`} />
          <SummaryRow label="Custo unitário" value={brl(unit)} />
          <div style={{ borderTop: '1px solid var(--line)', marginTop: 8, paddingTop: 8 }}>
            <SummaryRow label="Total da nota" value={brl(total)} strong />
          </div>
          <div style={{ borderTop: '1px solid var(--line)', marginTop: 12, paddingTop: 12 }}>
            <SummaryRow label="Estoque antes" value={`${PICK.stock} ${c.unitPlural}`} />
            <SummaryRow label="Estoque depois" value={`${PICK.stock + qty} ${c.unitPlural}`} tone="success" />
          </div>
        </div>
      )}
    >
      <FormCard title="Produto" desc="Busque pelo SKU, código de barras ou nome." cols={1}>
        <ProductPicker product={PICK} onClear={() => {}} />
      </FormCard>

      <FormCard title="Dados da compra" cols={3}>
        <Field label="Quantidade" required span={1} hint={`Em ${c.unitPlural}.`}>
          <TextInput mono type="number" value={qty} onChange={(e) => setQty(+e.target.value || 0)} suffix={c.unit === 'unidade' ? 'un' : c.unit} />
        </Field>
        <Field label="Preço de compra unitário" required span={1}>
          <TextInput mono prefix="R$" type="number" value={unit} onChange={(e) => setUnit(+e.target.value || 0)} />
        </Field>
        <Field label="Data da compra" required span={1}>
          <TextInput type="date" defaultValue="2026-09-18" />
        </Field>
        <Field label="Fornecedor" required span={2}>
          <SelectInput value="TechDistrib" onChange={() => {}} options={['TechDistrib', 'Vento Sul', 'Malha & Cia', 'Grão Nobre', 'Lar Import', 'Papel Forte']} />
        </Field>
        <Field label="Nota fiscal" span={1}>
          <TextInput mono placeholder="NF 8421" />
        </Field>
        <Field label="Destino" span={2} hint="Unidade que recebe a mercadoria.">
          <SelectInput value="Loja Centro" onChange={() => {}} options={MOCK.store.siblings.map(s => s.name)} />
        </Field>
        <Field label="Local de estoque" span={1}>
          <SelectInput value="A-04" onChange={() => {}} options={['A-04', 'A-05', 'B-12', 'C-01', 'D-02', 'Depósito']} />
        </Field>
        <Field label="Observações" span={3}>
          <TextareaInput placeholder="Ex.: duas caixas chegaram amassadas, conteúdo conferido e aceito." />
        </Field>
      </FormCard>

      <div style={{ padding: '12px 14px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 8, display: 'flex', gap: 10, alignItems: 'center' }}>
        <span style={{ color: 'var(--fg-muted)' }}><I.Truck size={15} /></span>
        <div style={{ fontSize: 12, color: 'var(--fg-muted)', flex: 1 }}>
          Recebeu vários SKUs na mesma nota? Leia o XML da NF-e e lance tudo de uma vez.
        </div>
        <button className="btn btn-outline btn-sm">Importar XML da NF-e</button>
      </div>
    </MovementPage>
  );
}

// === Sale (POS) ===
// Balcão real vende vários itens por atendimento, então a venda é um carrinho —
// não um SKU. Desconto existe por linha E no total, que é como a loja negocia.

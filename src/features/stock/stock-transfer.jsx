"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { MOCK, catById } from '@/lib/mock';
import { PICK } from '@/features/stock/pick';
import { MovementPage } from '@/features/stock/movement-page';
import { SummaryRow } from '@/components/ui/summary-row';
import { FormCard } from '@/components/ui/form-card';
import { ProductPicker } from '@/components/ui/product-picker';
import { Field } from '@/components/ui/field';
import { SelectInput } from '@/components/ui/select-input';
import { TextInput } from '@/components/ui/text-input';
import { TextareaInput } from '@/components/ui/textarea-input';
import { I } from '@/components/icons';

export function StockTransfer() {
  const navigate = useNavigate();
  const [qty, setQty] = React.useState(12);
  const [dest, setDest] = React.useState('Loja Campinas');
  const c = catById(PICK.cat);
  const destStock = { 'Loja Shopping Norte': 28, 'Loja Campinas': 9, 'Centro de Distribuição': 164 }[dest] ?? 0;
  const insufficient = qty > PICK.stock;

  return (
    <MovementPage
      route="/stock/transfer" navigate={navigate}
      title="Transferência entre lojas"
      sub="Um lançamento, duas movimentações: saída da origem e entrada no destino."
      submitLabel={insufficient ? 'Saldo insuficiente na origem' : 'Confirmar transferência'}
      aside={(
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 10 }}>Resumo da transferência</div>
          <SummaryRow label={`${c.unitPlural} movidos`} value={`${qty}`} strong />
          <div style={{ borderTop: '1px solid var(--line)', marginTop: 12, paddingTop: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginBottom: 6 }}>Loja Centro (origem)</div>
            <SummaryRow label="Antes" value={`${PICK.stock} ${c.unitPlural}`} />
            <SummaryRow label="Depois" value={`${Math.max(PICK.stock - qty, 0)} ${c.unitPlural}`} tone={insufficient ? 'danger' : 'warning'} />
          </div>
          <div style={{ borderTop: '1px solid var(--line)', marginTop: 12, paddingTop: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginBottom: 6 }}>{dest} (destino)</div>
            <SummaryRow label="Antes" value={`${destStock} ${c.unitPlural}`} />
            <SummaryRow label="Depois" value={`${destStock + qty} ${c.unitPlural}`} tone="success" />
          </div>
          <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 12, lineHeight: 1.5 }}>
            A transferência não altera o valor de estoque da rede — apenas onde a mercadoria está.
          </div>
        </div>
      )}
    >
      <FormCard title="Produto" cols={1}>
        <ProductPicker product={PICK} onClear={() => {}} />
      </FormCard>

      <FormCard title="Origem e destino" cols={2}>
        <Field label="Unidade de origem" required span={1} hint={`Saldo atual: ${PICK.stock} ${c.unitPlural}.`}>
          <SelectInput value="Loja Centro" onChange={() => {}} options={MOCK.store.siblings.map(s => s.name)} />
        </Field>
        <Field label="Unidade de destino" required span={1} hint={`Saldo atual: ${destStock} ${c.unitPlural}.`}>
          <SelectInput value={dest} onChange={setDest} options={MOCK.store.siblings.filter(s => !s.current).map(s => s.name)} />
        </Field>
        <Field label="Quantidade" required span={1} error={insufficient ? 'Acima do saldo da unidade de origem.' : null}>
          <TextInput mono type="number" value={qty} onChange={(e) => setQty(+e.target.value || 0)} suffix={c.unit === 'unidade' ? 'un' : c.unit} />
        </Field>
        <Field label="Data de envio" required span={1}>
          <TextInput type="date" defaultValue="2026-09-18" />
        </Field>
        <Field label="Motivo" required span={2}>
          <SelectInput value="Reposição por ruptura no destino" onChange={() => {}}
            options={['Reposição por ruptura no destino', 'Balanceamento de estoque', 'Remanejamento sazonal', 'Devolução ao centro de distribuição', 'Pedido de cliente em outra loja']} />
        </Field>
        <Field label="Responsável pelo envio" span={1}>
          <SelectInput value="Ana Ribeiro" onChange={() => {}} options={['Ana Ribeiro', 'Mariana Souza', 'Roberto Lima']} />
        </Field>
        <Field label="Transportadora" span={1}>
          <SelectInput value="Malha interna" onChange={() => {}} options={['Malha interna', 'Transportadora parceira', 'Retirada no local']} />
        </Field>
        <Field label="Observações" span={2}>
          <TextareaInput placeholder="Ex.: enviar junto com a remessa semanal de sexta-feira." />
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

// === Exchange ===

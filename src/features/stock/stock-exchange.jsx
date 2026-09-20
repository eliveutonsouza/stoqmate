"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { catById } from '@/lib/mock';
import { PICK } from '@/features/stock/pick';
import { PICK_B } from '@/features/stock/pick-b';
import { MovementPage } from '@/features/stock/movement-page';
import { SummaryRow } from '@/components/ui/summary-row';
import { brl } from '@/lib/format';
import { FormCard } from '@/components/ui/form-card';
import { ProductPicker } from '@/components/ui/product-picker';
import { I } from '@/components/icons';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { SelectInput } from '@/components/ui/select-input';
import { TextareaInput } from '@/components/ui/textarea-input';

export function StockExchange() {
  const navigate = useNavigate();
  const [qty, setQty] = React.useState(1);
  const c = catById(PICK.cat);
  const diff = (PICK_B.sale - PICK.sale) * qty;
  return (
    <MovementPage
      route="/stock/exchange" navigate={navigate}
      title="Registrar troca"
      sub="Gera duas movimentações: entrada do item devolvido e saída do item entregue."
      submitLabel="Confirmar troca"
      aside={(
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 10 }}>Resumo da troca</div>
          <SummaryRow label="Itens trocados" value={`${qty}`} />
          <SummaryRow label="Valor do item devolvido" value={brl(PICK.sale * qty)} />
          <SummaryRow label="Valor do item entregue" value={brl(PICK_B.sale * qty)} />
          <div style={{ borderTop: '1px solid var(--line)', marginTop: 8, paddingTop: 8 }}>
            <SummaryRow
              label={diff > 0 ? 'Cliente paga a diferença' : diff < 0 ? 'Loja devolve a diferença' : 'Sem diferença'}
              value={brl(Math.abs(diff))} strong
              tone={diff > 0 ? 'success' : diff < 0 ? 'warning' : undefined}
            />
          </div>
          <div style={{ borderTop: '1px solid var(--line)', marginTop: 12, paddingTop: 12 }}>
            <SummaryRow label="Preto depois" value={`${PICK.stock + qty} ${c.unitPlural}`} tone="success" />
            <SummaryRow label="Branco depois" value={`${PICK_B.stock - qty} ${c.unitPlural}`} />
          </div>
        </div>
      )}
    >
      <FormCard title="Item devolvido pelo cliente" desc="Volta para o estoque na confirmação." cols={1}>
        <ProductPicker product={PICK} onClear={() => {}} />
      </FormCard>

      <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--fg-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, padding: '4px 12px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 100 }}>
          <I.ArrowDown size={13} /> troca por
        </div>
      </div>

      <FormCard title="Item entregue ao cliente" desc="Sai do estoque na confirmação." cols={1}>
        <ProductPicker product={PICK_B} onClear={() => {}} />
      </FormCard>

      <FormCard title="Detalhes" cols={2}>
        <Field label="Quantidade" required span={1}>
          <TextInput mono type="number" value={qty} onChange={(e) => setQty(+e.target.value || 0)} suffix={c.unit === 'unidade' ? 'un' : c.unit} />
        </Field>
        <Field label="Data da troca" required span={1}>
          <TextInput type="date" defaultValue="2026-09-18" />
        </Field>
        <Field label="Motivo da troca" required span={2}>
          <SelectInput value="Variação incorreta" onChange={() => {}}
            options={['Variação incorreta', 'Cor diferente da desejada', 'Defeito de fabricação', 'Desistência do cliente', 'Presente trocado']} />
        </Field>
        <Field label="Venda de origem" span={1} hint="Referência da venda original.">
          <TextInput mono defaultValue="#4241" />
        </Field>
        <Field label="Atendente" span={1}>
          <SelectInput value="Lucas Prado" onChange={() => {}} options={['Lucas Prado', 'Marina Alves', 'Ana Ribeiro']} />
        </Field>
        <Field label="Observações" span={2}>
          <TextareaInput placeholder="Ex.: item devolvido sem sinais de uso, embalagem original." />
        </Field>
      </FormCard>
    </MovementPage>
  );
}

// === Return ===

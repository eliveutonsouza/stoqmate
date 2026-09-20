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

export function StockAdjustment() {
  const navigate = useNavigate();
  const [real, setReal] = React.useState(40);
  const c = catById(PICK.cat);
  const system = PICK.stock;
  const diff = real - system;
  const lossValue = Math.abs(diff) * PICK.purchase;

  return (
    <MovementPage
      route="/stock/adjustment" navigate={navigate}
      title="Ajuste de inventário"
      sub="Alinhe o saldo do sistema com a contagem física. Toda divergência exige justificativa."
      submitLabel="Confirmar ajuste"
      aside={(
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 10 }}>Resultado do ajuste</div>
          <SummaryRow label="Saldo no sistema" value={`${system} ${c.unitPlural}`} />
          <SummaryRow label="Contagem física" value={`${real} ${c.unitPlural}`} />
          <div style={{ borderTop: '1px solid var(--line)', marginTop: 8, paddingTop: 8 }}>
            <SummaryRow
              label={diff === 0 ? 'Sem divergência' : diff > 0 ? 'Sobra encontrada' : 'Falta encontrada'}
              value={(diff > 0 ? '+' : '') + diff + ' ' + c.unitPlural}
              strong
              tone={diff === 0 ? 'success' : diff > 0 ? 'warning' : 'danger'}
            />
          </div>
          {diff !== 0 && (
            <div style={{ borderTop: '1px solid var(--line)', marginTop: 12, paddingTop: 12 }}>
              <SummaryRow label={diff < 0 ? 'Valor da perda' : 'Valor da sobra'} value={brl(lossValue)} tone={diff < 0 ? 'danger' : undefined} />
              <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 6, lineHeight: 1.5 }}>
                Calculado pelo preço de compra ({brl(PICK.purchase)} por {c.unit}).
              </div>
            </div>
          )}
        </div>
      )}
    >
      <FormCard title="Produto conferido" cols={1}>
        <ProductPicker product={PICK} onClear={() => {}} />
      </FormCard>

      <FormCard title="Contagem" cols={3}>
        <Field label="Saldo no sistema" span={1} hint="Calculado pelo histórico.">
          <TextInput mono value={system} readOnly suffix={c.unit === 'unidade' ? 'un' : c.unit} style={{ background: 'var(--bg-sunken)' }} />
        </Field>
        <Field label="Contagem física" required span={1} hint="O que você contou no local.">
          <TextInput mono type="number" value={real} onChange={(e) => setReal(+e.target.value || 0)} suffix={c.unit === 'unidade' ? 'un' : c.unit} />
        </Field>
        <Field label="Diferença" span={1}>
          <TextInput mono value={(diff > 0 ? '+' : '') + diff} readOnly suffix={c.unit === 'unidade' ? 'un' : c.unit} style={{
            background: 'var(--bg-sunken)',
            color: diff === 0 ? 'var(--fg)' : diff > 0 ? 'var(--warning)' : 'var(--danger)',
            fontWeight: 600,
          }} />
        </Field>
        <Field label="Data do ajuste" required span={1}>
          <TextInput type="date" defaultValue="2026-09-18" />
        </Field>
        <Field label="Responsável" span={1}>
          <SelectInput value="Ana Ribeiro" onChange={() => {}} options={['Ana Ribeiro', 'Mariana Souza', 'Roberto Lima']} />
        </Field>
        <Field label="Lote de inventário" span={1}>
          <TextInput mono defaultValue="INV-06" />
        </Field>
      </FormCard>

      <FormCard title="Justificativa" desc="Obrigatória sempre que houver divergência. Fica registrada no log de auditoria." cols={1}>
        <Field label="Motivo da divergência" required>
          <SelectInput value={diff < 0 ? 'Furto / extravio' : 'Erro de lançamento anterior'} onChange={() => {}}
            options={['Erro de lançamento anterior', 'Furto / extravio', 'Item danificado descartado', 'Venda não registrada', 'Devolução não registrada', 'Transferência não confirmada', 'Contagem anterior incorreta']} />
        </Field>
        <Field label="Detalhamento" required hint="Descreva o que foi verificado. Mínimo 20 caracteres.">
          <TextareaInput defaultValue="Conferência completa do local A-04. Duas unidades de 128 GB não localizadas; imagens do dia 16/09 em análise pelo setor de prevenção de perdas." style={{ minHeight: 84 }} />
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
            Este ajuste {diff < 0 ? 'baixa' : 'sobe'} <strong>{Math.abs(diff)} {c.unitPlural}</strong> e não pode ser desfeito —
            apenas corrigido por um novo ajuste. O gestor financeiro é notificado de divergências acima de {brl(200)}.
          </div>
        </div>
      )}
    </MovementPage>
  );
}

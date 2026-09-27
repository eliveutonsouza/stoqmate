"use client";

import * as React from 'react';
import { I } from '@/components/icons';
import { brl } from '@/lib/format';
import { paymentTotals, REFUND_METHODS, SALE_METHODS } from '@/lib/payment-methods';

const INSTALLMENTS = [1, 2, 3, 4, 5, 6, 10, 12];
const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;

// Formas de pagamento de um documento (venda, troca, devolução). Registra
// como o cliente pagou — o dinheiro passa pela maquininha/PIX da loja.
//
// value/onChange: [{ method, amount, installments }]. Com uma forma só, o
// valor acompanha o total sozinho; "Dividir" abre outras linhas.
//   refund       — só formas que servem pra devolver (dinheiro, PIX, crédito, outro)
//   multiple     — permite dividir (desktop); o tablet usa uma forma só
//   customer     — { id, name, credit_balance } | null (crédito da loja)
//   cashBlocked  — texto quando dinheiro está indisponível (caixa fechado)
export function PaymentSplit({ total, value, onChange, refund = false, multiple = true, customer = null, cashBlocked = null }) {
  const methods = refund ? REFUND_METHODS : SALE_METHODS;
  const rows = value.length ? value : [{ method: methods[0].id, amount: total, installments: 1 }];
  const single = rows.length === 1;
  const { remaining } = paymentTotals(rows, total);

  // Uma forma só: o valor segue o total (desconto, item removido...).
  React.useEffect(() => {
    if (single && round2(rows[0].amount) !== round2(total)) onChange([{ ...rows[0], amount: round2(total) }]);
  }, [single, total]); // eslint-disable-line react-hooks/exhaustive-deps

  const credit = Number(customer?.credit_balance ?? 0);
  const disabledReason = (m) => {
    if (m.needsCustomer && !customer) return 'Selecione o cliente';
    if (m.needsCustomer && !refund && credit <= 0) return 'Cliente sem crédito';
    if (m.id === 'dinheiro' && cashBlocked) return cashBlocked;
    return null;
  };
  const setRow = (i, patch) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const removeRow = (i) => onChange(rows.filter((_, j) => j !== i));
  const addRow = () => {
    const used = new Set(rows.map((r) => r.method));
    const next = methods.find((m) => !used.has(m.id) && !disabledReason(m)) ?? methods.find((m) => !disabledReason(m)) ?? methods[0];
    onChange([...rows, { method: next.id, amount: Math.max(0, remaining), installments: 1 }]);
  };

  const creditUsed = rows.filter((r) => r.method === 'credito_loja').reduce((s, r) => s + round2(r.amount), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {single ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {methods.map((m) => {
            const reason = disabledReason(m);
            const on = rows[0].method === m.id;
            return (
              <button key={m.id} type="button" disabled={Boolean(reason)} title={reason ?? undefined}
                onClick={() => onChange([{ method: m.id, amount: round2(total), installments: 1 }])}
                style={{
                  padding: '8px 9px', fontSize: 12, fontWeight: 500, textAlign: 'left',
                  border: '1px solid ' + (on ? 'var(--accent)' : 'var(--line)'),
                  background: on ? 'var(--accent-soft)' : 'var(--bg-elev)',
                  color: on ? 'var(--accent-text)' : 'var(--fg)',
                  borderRadius: 6, opacity: reason ? 0.45 : 1, cursor: reason ? 'not-allowed' : 'pointer',
                }}>
                {m.short}
                {m.needsCustomer && customer && !refund && <span style={{ display: 'block', fontSize: 10.5, color: 'var(--fg-muted)', fontWeight: 400 }}>saldo {brl(credit)}</span>}
              </button>
            );
          })}
        </div>
      ) : (
        rows.map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <select value={r.method} onChange={(e) => setRow(i, { method: e.target.value, installments: 1 })} aria-label={`Forma ${i + 1}`}
              className="input" style={{ flex: 1, height: 32, fontSize: 12 }}>
              {methods.map((m) => <option key={m.id} value={m.id} disabled={Boolean(disabledReason(m))}>{m.short}</option>)}
            </select>
            <input className="input" type="number" min="0" step="0.01" value={r.amount} aria-label={`Valor ${i + 1}`}
              onChange={(e) => setRow(i, { amount: e.target.value === '' ? 0 : Number(e.target.value) })}
              style={{ width: 96, height: 32, fontSize: 12, fontFamily: 'var(--font-mono)' }} />
            <button type="button" onClick={() => removeRow(i)} aria-label={`Remover forma ${i + 1}`} className="btn btn-ghost btn-sm" style={{ padding: '0 6px' }}><I.X size={12} /></button>
          </div>
        ))
      )}

      {rows.map((r, i) => (r.method === 'credito' && !refund ? (
        <label key={`inst-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          <span style={{ color: 'var(--fg-muted)' }}>Parcelas{rows.length > 1 ? ` (crédito ${brl(r.amount)})` : ''}</span>
          <select className="input" value={r.installments ?? 1} onChange={(e) => setRow(i, { installments: Number(e.target.value) })} style={{ height: 30, fontSize: 12, width: 80 }}>
            {INSTALLMENTS.map((n) => <option key={n} value={n}>{n}×</option>)}
          </select>
        </label>
      ) : null))}

      {multiple && (
        <button type="button" onClick={addRow} className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start', padding: '0 4px' }}>
          <I.Plus size={12} /> {single ? 'Dividir em outra forma' : 'Adicionar forma'}
        </button>
      )}

      {!single && (
        <div style={{ fontSize: 12, color: Math.abs(remaining) > 0.01 ? 'var(--danger)' : 'var(--success)' }}>
          {Math.abs(remaining) <= 0.01 ? 'Valor distribuído.' : remaining > 0 ? `Falta distribuir ${brl(remaining)}.` : `Passou do total em ${brl(-remaining)}.`}
        </div>
      )}
      {creditUsed > credit + 0.01 && !refund && (
        <div role="alert" style={{ fontSize: 12, color: 'var(--danger)' }}>Crédito da loja maior que o saldo do cliente ({brl(credit)}).</div>
      )}
      <div style={{ fontSize: 11, color: 'var(--fg-muted)', lineHeight: 1.45 }}>
        {refund ? 'Registra como o valor volta ao cliente.' : 'Registra como o cliente pagou — o dinheiro passa pela maquininha ou PIX da loja.'}
      </div>
    </div>
  );
}

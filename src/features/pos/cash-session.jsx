"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { brl } from '@/lib/format';
import { TextInput } from '@/components/ui/text-input';
import { FormCard } from '@/components/ui/form-card';
import { Field } from '@/components/ui/field';
import { SelectInput } from '@/components/ui/select-input';
import { TextareaInput } from '@/components/ui/textarea-input';
import { SummaryRow } from '@/components/ui/summary-row';

export function CashSession() {
  const navigate = useNavigate();
  const [counted, setCounted] = React.useState({ 200: 2, 100: 6, 50: 8, 20: 14, 10: 12, 5: 9, 2: 7, 1: 12, moedas: 38.45 });
  const notes = [200, 100, 50, 20, 10, 5, 2];
  const set = (k, v) => setCounted(c => ({ ...c, [k]: v }));

  const opening = 300.00;
  const cashSales = 1842.50;
  const supply = 500.00;
  const withdraw = 800.00;
  const expected = opening + cashSales + supply - withdraw;
  const physical = notes.reduce((s, n) => s + n * (counted[n] || 0), 0) + (counted[1] || 0) * 1 + (counted.moedas || 0);
  const diff = physical - expected;

  const movements = [
    { time: '14:02', kind: 'open', label: 'Abertura de caixa', by: 'Lucas Prado', value: 300.00 },
    { time: '15:48', kind: 'supply', label: 'Suprimento · troco do cofre', by: 'Ana Ribeiro', value: 500.00 },
    { time: '17:20', kind: 'withdraw', label: 'Sangria · depósito bancário', by: 'Ana Ribeiro', value: -800.00 },
    { time: '19:04', kind: 'sale', label: '86 vendas em dinheiro', by: 'Lucas · Marina', value: 1842.50 },
  ];
  const KIND = {
    open: ['Abertura', 'var(--info)', 'var(--info-soft)'],
    supply: ['Suprimento', 'var(--success)', 'var(--success-soft)'],
    withdraw: ['Sangria', 'var(--warning)', 'var(--warning-soft)'],
    sale: ['Vendas', 'var(--fg-muted)', 'var(--bg-sunken)'],
  };

  return (
    <StoreShell route="/cash" breadcrumb={['Caixa']} navigate={navigate}
      headerActions={(
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--fg-muted)' }}>
          <span className="pulse"></span><span>Caixa aberto há 8 h 40 min</span>
        </div>
      )}
    >
      <PageHeader
        title="Fechamento de caixa"
        sub="Balcão 01 · turno de 18/09 14:00–22:00 · Lucas Prado"
        actions={(
          <>
            <button className="btn btn-outline btn-sm"><I.Plus size={13} /> Suprimento</button>
            <button className="btn btn-outline btn-sm"><I.ArrowDown size={13} /> Sangria</button>
            <button className="btn btn-outline btn-sm"><I.Download size={13} /> Relatório do turno</button>
          </>
        )}
      />
      <Page>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
          {[
            { l: 'Vendas do turno', v: brl(6284.40), s: '142 atendimentos' },
            { l: 'Em dinheiro', v: brl(cashSales), s: '86 vendas' },
            { l: 'Em cartão e PIX', v: brl(4441.90), s: '56 vendas' },
            { l: 'Ticket médio', v: brl(44.26), s: 'no turno' },
            { l: 'Descontos', v: brl(312.80), s: '4,7% das vendas' },
          ].map((m, i) => (
            <div key={i} style={{ padding: '14px 16px', borderRight: i < 4 ? '1px solid var(--line)' : 'none' }}>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{m.l}</div>
              <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-0.022em', fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>{m.v}</div>
              <div style={{ fontSize: 10, color: 'var(--fg-muted)', marginTop: 2 }}>{m.s}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 16, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Contagem de gaveta</h3>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>
                  Conte por cédula. O sistema não mostra o esperado até você fechar — contagem cega evita viés.
                </p>
              </div>
              <div style={{ padding: 18, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {notes.map(n => (
                  <div key={n}>
                    <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginBottom: 5, fontFamily: 'var(--font-mono)' }}>R$ {n}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <TextInput mono type="number" value={counted[n] || 0} onChange={(e) => set(n, +e.target.value || 0)} style={{ height: 32 }} />
                      <span style={{ fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', minWidth: 62, textAlign: 'right' }}>
                        {brl(n * (counted[n] || 0))}
                      </span>
                    </div>
                  </div>
                ))}
                <div>
                  <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginBottom: 5, fontFamily: 'var(--font-mono)' }}>R$ 1 + moedas</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <TextInput mono type="number" value={counted.moedas} onChange={(e) => set('moedas', +e.target.value || 0)} style={{ height: 32 }} />
                    <span style={{ fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', minWidth: 62, textAlign: 'right' }}>
                      {brl(counted.moedas)}
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ padding: '12px 18px', background: 'var(--bg-sunken)', borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>Total contado na gaveta</span>
                <span style={{ fontSize: 20, fontWeight: 600, fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>{brl(physical)}</span>
              </div>
            </div>

            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Movimentos do caixa</h3>
              </div>
              <table className="table">
                <thead>
                  <tr><th style={{ width: 70 }}>Hora</th><th style={{ width: 120 }}>Tipo</th><th>Descrição</th><th>Por</th><th className="num">Valor</th></tr>
                </thead>
                <tbody>
                  {movements.map((m, i) => {
                    const [label, color, soft] = KIND[m.kind];
                    return (
                      <tr key={i}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{m.time}</td>
                        <td><span style={{ padding: '2px 7px', borderRadius: 4, background: soft, color, fontSize: 11, fontWeight: 500 }}>{label}</span></td>
                        <td style={{ fontSize: 13 }}>{m.label}</td>
                        <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{m.by}</td>
                        <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500, color: m.value < 0 ? 'var(--danger)' : 'var(--fg)' }}>
                          {m.value < 0 ? '− ' : ''}{brl(Math.abs(m.value))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {Math.abs(diff) > 0.01 && (
              <FormCard title="Justificativa da diferença" desc="Obrigatória quando a gaveta não fecha. Fica no log e notifica o gestor." cols={1}>
                <Field label="Motivo" required>
                  <SelectInput value={diff < 0 ? 'Troco dado a mais' : 'Venda não registrada'} onChange={() => {}}
                    options={['Troco dado a mais', 'Troco dado a menos', 'Venda não registrada', 'Sangria não lançada', 'Erro de contagem anterior', 'Outro']} />
                </Field>
                <Field label="Detalhamento" required>
                  <TextareaInput defaultValue="Conferido duas vezes por dois operadores. Provável erro de troco no pico da tarde." style={{ minHeight: 64 }} />
                </Field>
              </FormCard>
            )}
          </div>

          <div style={{ position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 10 }}>Conferência</div>
              <SummaryRow label="Abertura" value={brl(opening)} />
              <SummaryRow label="Vendas em dinheiro" value={brl(cashSales)} />
              <SummaryRow label="Suprimentos" value={'+ ' + brl(supply)} />
              <SummaryRow label="Sangrias" value={'− ' + brl(withdraw)} tone="warning" />
              <div style={{ borderTop: '1px solid var(--line)', marginTop: 8, paddingTop: 8 }}>
                <SummaryRow label="Esperado na gaveta" value={brl(expected)} />
                <SummaryRow label="Contado" value={brl(physical)} />
              </div>
              <div style={{ borderTop: '1px solid var(--line)', marginTop: 8, paddingTop: 8 }}>
                <SummaryRow
                  label={Math.abs(diff) < 0.01 ? 'Caixa fecha' : diff < 0 ? 'Falta' : 'Sobra'}
                  value={Math.abs(diff) < 0.01 ? 'OK' : brl(Math.abs(diff))}
                  strong tone={Math.abs(diff) < 0.01 ? 'success' : diff < 0 ? 'danger' : 'warning'}
                />
              </div>
            </div>

            <button onClick={() => navigate('/dashboard')} className="btn btn-primary btn-lg" style={{ justifyContent: 'center', width: '100%' }}>
              Fechar caixa e encerrar turno
            </button>
            <button onClick={() => navigate('/pos')} className="btn btn-outline" style={{ justifyContent: 'center', width: '100%' }}>
              Voltar ao balcão
            </button>

            <div style={{ padding: '11px 13px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 8, display: 'flex', gap: 10 }}>
              <span style={{ color: 'var(--fg-muted)', flexShrink: 0, marginTop: 1 }}><I.Shield size={14} /></span>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
                Depois de fechado, o turno não aceita lançamentos retroativos — correções entram no turno seguinte.
              </div>
            </div>
          </div>
        </div>
      </Page>
    </StoreShell>
  );
}

// === /receipt — printable receipt ===

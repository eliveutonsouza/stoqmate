"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { useRouter } from 'next/navigation';
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
import { Modal } from '@/components/ui/modal';
import { cashSessionOpenAction, cashSessionMovementAction, cashSessionCloseAction } from '@/features/pos/actions';

const NOTES = [200, 100, 50, 20, 10, 5, 2];
const KIND = {
  open: ['Abertura', 'var(--info)', 'var(--info-soft)'],
  supply: ['Suprimento', 'var(--success)', 'var(--success-soft)'],
  withdraw: ['Sangria', 'var(--warning)', 'var(--warning-soft)'],
  sale: ['Vendas', 'var(--fg-muted)', 'var(--bg-sunken)'],
};
const REASONS = ['Troco dado a mais', 'Troco dado a menos', 'Venda não registrada', 'Sangria não lançada', 'Erro de contagem anterior', 'Outro'];

export function CashSession({ stores, storeId, session }) {
  const navigate = useNavigate();
  const router = useRouter();
  const [openingAmount, setOpeningAmount] = React.useState(0);
  const [counted, setCounted] = React.useState({});
  const [movementModal, setMovementModal] = React.useState(null); // 'supply' | 'withdraw' | null
  const [movementAmount, setMovementAmount] = React.useState(0);
  const [movementNote, setMovementNote] = React.useState('');
  const [reason, setReason] = React.useState(REASONS[0]);
  const [detail, setDetail] = React.useState('');
  const [error, setError] = React.useState('');
  const [pending, startTransition] = React.useTransition();

  const set = (k, v) => setCounted((c) => ({ ...c, [k]: v }));

  if (!session) {
    return (
      <StoreShell route="/cash" breadcrumb={['Caixa']} navigate={navigate}>
        <PageHeader title="Abrir caixa" sub="Nenhum caixa aberto nesta unidade — informe o valor inicial da gaveta para começar o turno." />
        <Page>
          {stores.length > 1 && (
            <FormCard title="Unidade" cols={1}>
              <SelectInput value={storeId} onChange={(v) => navigate(`/cash?store=${v}`)} options={stores.map((s) => ({ value: s.id, label: s.name }))} />
            </FormCard>
          )}
          <FormCard title="Abertura de caixa" cols={1}>
            <Field label="Valor inicial da gaveta" required>
              <TextInput mono prefix="R$" type="number" value={openingAmount} onChange={(e) => setOpeningAmount(+e.target.value || 0)} />
            </Field>
          </FormCard>
          {error && (
            <div style={{ padding: '10px 12px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 7, fontSize: 12, color: 'var(--fg)' }}>{error}</div>
          )}
          <button
            onClick={() => {
              setError('');
              startTransition(async () => {
                const result = await cashSessionOpenAction({ storeId, openingAmount });
                if (result?.error) { setError(result.error); return; }
                router.refresh();
              });
            }}
            disabled={pending || !storeId}
            className="btn btn-primary btn-lg" style={{ justifyContent: 'center', width: '100%' }}
          >
            {pending ? 'Abrindo…' : 'Abrir caixa'}
          </button>
        </Page>
      </StoreShell>
    );
  }

  const { movements, salesSummary } = session;
  const expected = movements.reduce((s, m) => s + m.amount, 0);
  const physical = NOTES.reduce((s, n) => s + n * (counted[n] || 0), 0) + (counted[1] || 0) * 1 + (counted.moedas || 0);
  const diff = physical - expected;
  const hasCounted = Object.keys(counted).length > 0;
  const canClose = hasCounted && (Math.abs(diff) < 0.01 || detail.trim().length >= 10);

  const submitMovement = () => {
    setError('');
    if (movementAmount <= 0) { setError('Informe um valor maior que zero.'); return; }
    startTransition(async () => {
      const result = await cashSessionMovementAction({ sessionId: session.id, kind: movementModal, amount: movementAmount, note: movementNote });
      if (result?.error) { setError(result.error); return; }
      setMovementModal(null);
      setMovementAmount(0);
      setMovementNote('');
      router.refresh();
    });
  };

  const closeCash = () => {
    setError('');
    if (!canClose) return;
    startTransition(async () => {
      const result = await cashSessionCloseAction({
        sessionId: session.id, countedAmount: physical,
        discrepancyReason: Math.abs(diff) > 0.01 ? reason : '', discrepancyDetail: Math.abs(diff) > 0.01 ? detail : '',
      });
      if (result?.error) { setError(result.error); return; }
      navigate('/dashboard');
    });
  };

  return (
    <StoreShell route="/cash" breadcrumb={['Caixa']} navigate={navigate}
      headerActions={(
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--fg-muted)' }}>
          <span className="pulse"></span><span>Caixa aberto desde {new Date(session.opened_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      )}
    >
      <PageHeader
        title="Fechamento de caixa"
        sub={`${stores.find((s) => s.id === storeId)?.name ?? ''} · operador ${session.operatorName}`}
        actions={(
          <>
            <button onClick={() => setMovementModal('supply')} className="btn btn-outline btn-sm"><I.Plus size={13} /> Suprimento</button>
            <button onClick={() => setMovementModal('withdraw')} className="btn btn-outline btn-sm"><I.ArrowDown size={13} /> Sangria</button>
          </>
        )}
      />
      <Page>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
          {[
            { l: 'Vendas do turno', v: brl(salesSummary.total), s: `${salesSummary.count} atendimentos` },
            { l: 'Em dinheiro', v: brl(salesSummary.cashTotal), s: `${salesSummary.cashCount} vendas` },
            { l: 'Em cartão, PIX e outros', v: brl(salesSummary.otherTotal), s: `${salesSummary.otherCount} vendas` },
            { l: 'Descontos', v: brl(salesSummary.discount), s: 'no turno' },
          ].map((m, i) => (
            <div key={i} style={{ padding: '14px 16px', borderRight: i < 3 ? '1px solid var(--line)' : 'none' }}>
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
                  Conte por cédula. A diferença para o esperado aparece assim que a contagem é preenchida.
                </p>
              </div>
              <div style={{ padding: 18, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {NOTES.map(n => (
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
                    <TextInput mono type="number" value={counted.moedas || 0} onChange={(e) => set('moedas', +e.target.value || 0)} style={{ height: 32 }} />
                    <span style={{ fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', minWidth: 62, textAlign: 'right' }}>
                      {brl(counted.moedas || 0)}
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
                  {movements.map((m) => {
                    const [label, color, soft] = KIND[m.kind];
                    return (
                      <tr key={m.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>
                          {new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td><span style={{ padding: '2px 7px', borderRadius: 4, background: soft, color, fontSize: 11, fontWeight: 500 }}>{label}</span></td>
                        <td style={{ fontSize: 13 }}>{m.note || '—'}</td>
                        <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{m.byName}</td>
                        <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500, color: m.amount < 0 ? 'var(--danger)' : 'var(--fg)' }}>
                          {m.amount < 0 ? '− ' : ''}{brl(Math.abs(m.amount))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {hasCounted && Math.abs(diff) > 0.01 && (
              <FormCard title="Justificativa da diferença" desc="Obrigatória quando a gaveta não fecha. Fica no log e notifica o gestor." cols={1}>
                <Field label="Motivo" required>
                  <SelectInput value={reason} onChange={setReason} options={REASONS} />
                </Field>
                <Field label="Detalhamento" required hint="Mínimo de 10 caracteres.">
                  <TextareaInput value={detail} onChange={(e) => setDetail(e.target.value)} style={{ minHeight: 64 }} />
                </Field>
              </FormCard>
            )}

            {error && (
              <div style={{ padding: '10px 12px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 7, fontSize: 12, color: 'var(--fg)' }}>{error}</div>
            )}
          </div>

          <div style={{ position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 10 }}>Conferência</div>
              <SummaryRow label="Esperado na gaveta" value={brl(expected)} />
              <SummaryRow label="Contado" value={brl(physical)} />
              <div style={{ borderTop: '1px solid var(--line)', marginTop: 8, paddingTop: 8 }}>
                <SummaryRow
                  label={!hasCounted ? 'Aguardando contagem' : Math.abs(diff) < 0.01 ? 'Caixa fecha' : diff < 0 ? 'Falta' : 'Sobra'}
                  value={!hasCounted ? '—' : Math.abs(diff) < 0.01 ? 'OK' : brl(Math.abs(diff))}
                  strong tone={!hasCounted ? undefined : Math.abs(diff) < 0.01 ? 'success' : diff < 0 ? 'danger' : 'warning'}
                />
              </div>
            </div>

            <button onClick={closeCash} disabled={!canClose || pending} className="btn btn-primary btn-lg"
              style={{ justifyContent: 'center', width: '100%', opacity: canClose && !pending ? 1 : 0.45 }}>
              {pending ? 'Fechando…' : 'Fechar caixa e encerrar turno'}
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

        <Modal
          open={!!movementModal} onClose={() => setMovementModal(null)}
          title={movementModal === 'supply' ? 'Suprimento de caixa' : 'Sangria de caixa'}
          desc={movementModal === 'supply' ? 'Dinheiro colocado na gaveta durante o turno.' : 'Dinheiro retirado da gaveta durante o turno.'}
          footer={(
            <>
              <button onClick={() => setMovementModal(null)} className="btn btn-ghost">Cancelar</button>
              <button onClick={submitMovement} disabled={pending} className="btn btn-primary">{pending ? 'Salvando…' : 'Confirmar'}</button>
            </>
          )}
        >
          <Field label="Valor" required>
            <TextInput mono prefix="R$" type="number" value={movementAmount} onChange={(e) => setMovementAmount(+e.target.value || 0)} />
          </Field>
          <Field label="Observação">
            <TextInput value={movementNote} onChange={(e) => setMovementNote(e.target.value)} placeholder={movementModal === 'supply' ? 'Ex.: troco trazido do cofre' : 'Ex.: depósito no cofre'} />
          </Field>
        </Modal>
      </Page>
    </StoreShell>
  );
}

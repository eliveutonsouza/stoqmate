"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { brl } from '@/lib/format';
import { EmptyState } from '@/components/ui/empty-state';
import { Modal } from '@/components/ui/modal';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { SelectInput } from '@/components/ui/select-input';
import { adjustCustomerCreditAction } from '@/features/customers/actions';

export function CustomerDetail({ detail }) {
  const navigate = useNavigate();
  const router = useRouter();
  const [creditOpen, setCreditOpen] = React.useState(false);
  const [kind, setKind] = React.useState('Crédito manual');
  const [amount, setAmount] = React.useState(0);
  const [error, setError] = React.useState('');
  const [pending, startTransition] = React.useTransition();

  if (!detail) {
    return (
      <StoreShell route="/customers/detail" breadcrumb={['Clientes', 'Detalhe']} navigate={navigate}>
        <PageHeader title="Cliente" />
        <Page>
          <EmptyState icon={<I.Alert size={18} />} title="Cliente não encontrado" desc="O link é inválido ou o cliente não existe mais."
            action={<button onClick={() => navigate('/customers')} className="btn btn-primary btn-sm">Voltar</button>} />
        </Page>
      </StoreShell>
    );
  }

  const { customer: c, sales, ledger, topProducts } = detail;
  const spent = sales.reduce((s, sale) => s + sale.total, 0);
  const ticket = sales.length ? spent / sales.length : 0;

  const submitCredit = () => {
    setError('');
    if (amount === 0) { setError('Informe um valor diferente de zero.'); return; }
    startTransition(async () => {
      const delta = kind === 'Retirada de crédito' ? -Math.abs(amount) : Math.abs(amount);
      const result = await adjustCustomerCreditAction({ customerId: c.id, delta, reason: kind });
      if (result?.error) { setError(result.error); return; }
      setCreditOpen(false);
      setAmount(0);
      router.refresh();
    });
  };

  return (
    <StoreShell route="/customers/detail" breadcrumb={['Clientes', c.name]} navigate={navigate}>
      <PageHeader
        title={c.name}
        sub={`${c.doc || 'sem documento'} · cliente desde ${new Date(c.created_at).toLocaleDateString('pt-BR')} · ${sales.length} compras`}
        actions={(
          <>
            <button onClick={() => setCreditOpen(true)} className="btn btn-outline btn-sm"><I.Credit size={13} /> Ajustar crédito</button>
            <button onClick={() => navigate(`/stock/sale?customer=${c.id}`)} className="btn btn-primary btn-sm"><I.Plus size={13} /> Nova venda</button>
          </>
        )}
      />
      <Page>
        <div className="g4 kpi-strip">
          {[
            { l: 'Total gasto', v: brl(spent) },
            { l: 'Ticket médio', v: brl(ticket) },
            { l: 'Compras', v: `${sales.length}`, s: sales[0] ? `última em ${new Date(sales[0].created_at).toLocaleDateString('pt-BR')}` : undefined },
            { l: 'Crédito disponível', v: brl(c.credit_balance), tone: c.credit_balance > 0 ? 'warn' : undefined },
          ].map((m, i) => (
            <div key={i} style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{m.l}</div>
              <div style={{
                fontSize: 19, fontWeight: 600, letterSpacing: '-0.022em', fontVariantNumeric: 'tabular-nums', marginTop: 4,
                color: m.tone === 'warn' ? 'var(--warning)' : 'var(--fg)',
              }}>{m.v}</div>
              {m.s && <div style={{ fontSize: 10, color: 'var(--fg-muted)', marginTop: 2 }}>{m.s}</div>}
            </div>
          ))}
        </div>

        {c.credit_balance > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 14px', background: 'var(--warning-soft)',
            border: '1px solid var(--warning)', borderRadius: 8,
          }}>
            <span style={{ color: 'var(--warning)', flexShrink: 0 }}><I.Credit size={15} /></span>
            <span style={{ fontSize: 12.5, color: 'var(--fg)', flex: 1, lineHeight: 1.5 }}>
              Este cliente tem <strong>{brl(c.credit_balance)}</strong> de crédito em loja.
            </span>
          </div>
        )}

        <div className="split-2" style={{ '--a': '1fr', '--b': '1.4fr', gap: 16, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Cadastro</h3>
              </div>
              {[
                ['Documento', c.doc || '—', true], ['Telefone', c.phone || '—', true],
                ['Email', c.email || '—'], ['Observações', c.notes || '—'],
              ].map(([k, v, mono], i, arr) => (
                <div key={k} style={{ display: 'flex', gap: 12, padding: '10px 18px', borderBottom: i < arr.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
                  <span style={{ fontSize: 12, color: 'var(--fg-muted)', width: 118, flexShrink: 0 }}>{k}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, fontFamily: mono ? 'var(--font-mono)' : undefined }}>{v}</span>
                </div>
              ))}
            </div>

            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Extrato de crédito</h3>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Sem prazo de validade.</p>
              </div>
              {ledger.length === 0 ? (
                <div style={{ padding: '18px', fontSize: 12.5, color: 'var(--fg-muted)' }}>Nenhuma movimentação de crédito ainda.</div>
              ) : ledger.map((k) => (
                <div key={k.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 18px', borderBottom: '1px solid var(--line-soft)' }}>
                  <span style={{
                    width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                    background: k.delta > 0 ? 'var(--success-soft)' : 'var(--bg-sunken)',
                    color: k.delta > 0 ? 'var(--success)' : 'var(--fg-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{k.delta > 0 ? <I.ArrowUp size={12} /> : <I.ArrowDown size={12} />}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5 }}>{k.reason}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{new Date(k.created_at).toLocaleDateString('pt-BR')}</div>
                  </div>
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 500, color: k.delta < 0 ? 'var(--fg-muted)' : 'var(--success)' }}>
                    {k.delta < 0 ? '− ' : '+ '}{brl(Math.abs(k.delta))}
                  </span>
                </div>
              ))}
              <div style={{ padding: '11px 18px', background: 'var(--bg-sunken)', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12.5, fontWeight: 500 }}>Saldo</span>
                <span style={{ fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{brl(c.credit_balance)}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card table-scroll">
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Histórico de compras</h3>
              </div>
              {sales.length === 0 ? (
                <div style={{ padding: '18px', fontSize: 12.5, color: 'var(--fg-muted)' }}>Nenhuma venda registrada para este cliente.</div>
              ) : (
                <table className="table">
                  <thead>
                    <tr><th>Data</th><th>Unidade</th><th className="num">Itens</th><th className="num">Valor</th></tr>
                  </thead>
                  <tbody>
                    {sales.map((s) => (
                      <tr key={s.id}>
                        <td style={{ fontSize: 12, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{new Date(s.created_at).toLocaleDateString('pt-BR')}</td>
                        <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{s.store?.name}</td>
                        <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{s.sale_items.reduce((a, i) => a + i.qty, 0)}</td>
                        <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{brl(s.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="card" style={{ padding: 'var(--density-card-pad)' }}>
              <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>O que costuma comprar</h3>
              <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--fg-muted)' }}>Produtos que este cliente mais levou.</p>
              {topProducts.length === 0 ? (
                <div style={{ fontSize: 12.5, color: 'var(--fg-muted)' }}>Sem histórico ainda.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {topProducts.map((p) => (
                    <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 12.5, flex: 1 }}>{p.name}</span>
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)', minWidth: 74, textAlign: 'right' }}>
                        {p.qty}× comprado
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Page>

      <Modal open={creditOpen} onClose={() => setCreditOpen(false)} title="Ajustar crédito em loja" width={420}
        footer={<><button onClick={() => setCreditOpen(false)} className="btn btn-ghost">Cancelar</button><button onClick={submitCredit} disabled={pending} className="btn btn-primary">{pending ? 'Salvando…' : 'Confirmar'}</button></>}>
        {error && <div style={{ padding: '10px 12px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 7, fontSize: 12 }}>{error}</div>}
        <Field label="Tipo">
          <SelectInput value={kind} onChange={setKind} options={['Crédito manual', 'Devolução', 'Retirada de crédito']} />
        </Field>
        <Field label="Valor" required>
          <TextInput mono prefix="R$" type="number" value={amount} onChange={(e) => setAmount(+e.target.value || 0)} />
        </Field>
      </Modal>
    </StoreShell>
  );
}

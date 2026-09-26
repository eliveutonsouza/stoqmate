"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { useRouter } from 'next/navigation';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { brl } from '@/lib/format';
import { Toolbar } from '@/components/ui/toolbar';
import { Pagination } from '@/components/ui/pagination';
import { useQueryUpdate } from '@/hooks/use-query-update';
import { StoreAvatar } from '@/components/domain/store-avatar';
import { Modal } from '@/components/ui/modal';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { TextareaInput } from '@/components/ui/textarea-input';
import { createCustomerAction } from '@/features/customers/actions';

function emptyForm() {
  return { name: '', doc: '', phone: '', email: '', notes: '' };
}

// Busca (?q), filtro de crédito (?credit=1) e página (?page) na URL — o
// servidor filtra e pagina (fn_customers_list).
export function Customers({ filters, pageSize, rows, total, stats }) {
  const navigate = useNavigate();
  const router = useRouter();
  const { update, pending: listPending } = useQueryUpdate();
  const [formOpen, setFormOpen] = React.useState(false);
  const [f, setF] = React.useState(emptyForm());
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const [error, setError] = React.useState('');
  const [pending, startTransition] = React.useTransition();

  const hasFilters = !!(filters.q || filters.credit);

  const submit = () => {
    setError('');
    if (!f.name.trim()) { setError('Informe o nome do cliente.'); return; }
    startTransition(async () => {
      const result = await createCustomerAction(f);
      if (result?.error) { setError(result.error); return; }
      setFormOpen(false);
      setF(emptyForm());
      router.refresh();
    });
  };

  return (
    <StoreShell route="/customers" breadcrumb={['Clientes']} navigate={navigate}>
      <PageHeader
        title="Clientes"
        sub="Cadastro opcional — habilita crédito em loja e histórico de compras"
        actions={<button onClick={() => setFormOpen(true)} className="btn btn-primary btn-sm"><I.Plus size={13} /> Cadastrar cliente</button>}
      />
      <Page>
        <div className="g3 kpi-strip">
          {[
            { l: 'Clientes cadastrados', v: `${stats.customerCount}` },
            { l: 'Total gasto (identificado)', v: brl(stats.totalSpent) },
            { l: 'Crédito em loja aberto', v: brl(stats.creditTotal), s: `${stats.creditCount} cliente${stats.creditCount === 1 ? '' : 's'}`, tone: 'warn' },
          ].map((m, i) => (
            <div key={i} style={{ padding: '16px 18px' }}>
              <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{m.l}</div>
              <div style={{ fontSize: 21, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>{m.v}</div>
              {m.s && <div style={{ fontSize: 10.5, marginTop: 2, color: m.tone === 'warn' ? 'var(--warning)' : 'var(--fg-muted)' }}>{m.s}</div>}
            </div>
          ))}
        </div>

        <Toolbar
          placeholder="Buscar por nome, documento, telefone ou email…"
          value={filters.q ?? ''}
          onChange={(q) => update({ q })}
          debounce={300}
          filters={[{
            label: 'Com crédito em loja', active: filters.credit,
            onClick: () => update({ credit: filters.credit ? null : '1' }),
          }]}
          right={<span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{total} de {stats.customerCount}</span>} />

        <div className="card" style={{ opacity: listPending ? 0.6 : 1, transition: 'opacity .15s' }}>
          {stats.customerCount === 0 ? (
            <div style={{ padding: '32px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Nenhum cliente cadastrado ainda</div>
              <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 4 }}>Cadastre clientes para liberar crédito em loja e histórico de compras.</div>
              <button onClick={() => setFormOpen(true)} className="btn btn-primary btn-sm" style={{ marginTop: 12 }}><I.Plus size={12} /> Cadastrar cliente</button>
            </div>
          ) : rows.length === 0 ? (
            <div style={{ padding: '32px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Nenhum cliente encontrado</div>
              <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 4 }}>
                {total > 0 ? 'Esta página não existe mais.' : 'Ninguém bate com a busca e os filtros atuais.'}
              </div>
              {total > 0
                ? <button type="button" onClick={() => update({ page: null })} className="btn btn-outline btn-sm" style={{ marginTop: 12 }}>Primeira página</button>
                : hasFilters && <button type="button" onClick={() => update({ q: null, credit: null })} className="btn btn-outline btn-sm" style={{ marginTop: 12 }}>Limpar filtros</button>}
            </div>
          ) : (
            <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Cliente</th><th>Documento</th><th>Contato</th>
                  <th className="num">Compras</th><th className="num">Total gasto</th>
                  <th className="num">Crédito</th><th>Última compra</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <StoreAvatar name={c.name} />
                        <a href={`/customers/detail?id=${c.id}`} onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; e.preventDefault(); navigate(`/customers/detail?id=${c.id}`); }} style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</a>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)' }}>{c.doc || '—'}</td>
                    <td style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>{c.phone || '—'}</td>
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{c.purchases_count}</td>
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{brl(c.total_spent)}</td>
                    <td className="num">
                      {c.credit_balance > 0
                        ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500, color: 'var(--warning)' }}>{brl(c.credit_balance)}</span>
                        : <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>—</span>}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>
                      {c.last_purchase_at ? new Date(c.last_purchase_at).toLocaleDateString('pt-BR') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
          {stats.customerCount > 0 && (
            <Pagination page={filters.page} pageSize={pageSize} total={total} pending={listPending} onPage={(page) => update({ page })} />
          )}
        </div>
      </Page>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Cadastrar cliente" desc="Só o nome é obrigatório — o resto pode vir depois." width={480}
        footer={<><button onClick={() => setFormOpen(false)} className="btn btn-ghost">Cancelar</button><button onClick={submit} disabled={pending} className="btn btn-primary">{pending ? 'Salvando…' : 'Salvar cliente'}</button></>}>
        {error && <div style={{ padding: '10px 12px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 7, fontSize: 12 }}>{error}</div>}
        <Field label="Nome ou razão social" required><TextInput value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Patrícia Menezes" /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="CPF ou CNPJ"><TextInput mono value={f.doc} onChange={(e) => set('doc', e.target.value)} placeholder="000.000.000-00" /></Field>
          <Field label="Telefone"><TextInput mono value={f.phone} onChange={(e) => set('phone', e.target.value)} placeholder="(11) 90000-0000" /></Field>
        </div>
        <Field label="Email" hint="Opcional. Fica no cadastro para contato."><TextInput type="email" value={f.email} onChange={(e) => set('email', e.target.value)} placeholder="cliente@email.com" /></Field>
        <Field label="Observações"><TextareaInput value={f.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Ex.: compra sempre para a obra, pede nota no CNPJ." /></Field>
      </Modal>
    </StoreShell>
  );
}

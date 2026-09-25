"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { AdminShell } from '@/components/ui/admin-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { Toolbar } from '@/components/ui/toolbar';
import { Pagination } from '@/components/ui/pagination';
import { useQueryUpdate } from '@/hooks/use-query-update';
import { StoreAvatar } from '@/components/domain/store-avatar';
import { PlanBadge } from '@/components/domain/plan-badge';
import { StatusBadge } from '@/components/domain/status-badge';
import { brl } from '@/lib/format';

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export function AdminSubscriptions({ overview }) {
  const navigate = useNavigate();
  const { rows, kpis, filters, pageSize, total, allTotal } = overview;
  const { update, pending } = useQueryUpdate();

  return (
    <AdminShell route="/admin/subscriptions" breadcrumb={['Assinaturas']} navigate={navigate}>
      <PageHeader
        title="Assinaturas"
        sub={`${allTotal} rede(s) · ${brl(kpis.mrr)} de MRR · ${kpis.pastDueCount} inadimplente(s)`}
      />
      <Page>
        <div className="g5 kpi-strip">
          {[
            { l: 'MRR', v: brl(kpis.mrr) },
            { l: 'ARR projetado', v: brl(kpis.arr), s: 'MRR atual × 12' },
            { l: 'Ticket médio', v: brl(kpis.avgTicket), s: 'por rede ativa/mês' },
            { l: 'Inadimplência', v: brl(kpis.pastDueTotal), s: `${kpis.pastDueCount} assinatura(s)`, tone: kpis.pastDueCount ? 'down' : undefined },
            { l: 'Conversão de trial', v: kpis.trialConversionPct == null ? '—' : `${kpis.trialConversionPct}%`, s: kpis.trialConversionPct == null ? 'nenhum trial concluído ainda' : 'trials já concluídos' },
          ].map((m, i) => (
            <div key={i} style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{m.l}</div>
              <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>{m.v}</div>
              <div style={{ fontSize: 10, marginTop: 2, color: m.tone === 'up' ? 'var(--success)' : m.tone === 'down' ? 'var(--danger)' : 'var(--fg-soft)', fontFamily: m.tone ? 'var(--font-mono)' : undefined }}>{m.s}</div>
            </div>
          ))}
        </div>

        <Toolbar
          placeholder="Buscar rede pelo nome…"
          value={filters.q ?? ''}
          onChange={(q) => update({ q })}
          debounce={300}
          right={<span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{total} de {allTotal} rede(s)</span>}
        />

        <div className="card" style={{ opacity: pending ? 0.6 : 1, transition: 'opacity .15s' }}>
          {rows.length === 0 ? (
            <div style={{ padding: '32px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{allTotal === 0 ? 'Nenhuma rede cadastrada ainda' : 'Nenhuma rede encontrada'}</div>
              {allTotal > 0 && (
                <>
                  <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 4 }}>
                    {total > 0 ? 'Esta página não existe mais.' : 'Nenhum nome bate com a busca.'}
                  </div>
                  <button type="button" onClick={() => update(total > 0 ? { page: null } : { q: null })} className="btn btn-outline btn-sm" style={{ marginTop: 12 }}>
                    {total > 0 ? 'Primeira página' : 'Limpar busca'}
                  </button>
                </>
              )}
            </div>
          ) : (
          <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Rede</th><th>Plano</th><th>Status</th><th>Ciclo</th>
                <th className="num">Valor</th><th>Próxima cobrança</th><th className="num">LTV</th><th style={{ width: 30 }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <td>
                    <button onClick={() => navigate(`/admin/subscriptions/detail?id=${s.id}`)} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                      <StoreAvatar name={s.name} />
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)' }}>{s.name}</span>
                    </button>
                  </td>
                  <td><PlanBadge plan={s.planName} /></td>
                  <td><StatusBadge status={s.status} /></td>
                  <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{s.cycle === 'yearly' ? 'anual' : s.cycle === 'monthly' ? 'mensal' : '—'}</td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{s.value ? brl(s.value) : '—'}</td>
                  <td style={{ fontSize: 12, color: s.status === 'past_due' ? 'var(--danger)' : 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>
                    {s.cancelAtPeriodEnd ? `cancela em ${fmtDate(s.nextCharge)}` : fmtDate(s.nextCharge)}
                  </td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500 }}>{s.ltv ? brl(s.ltv) : '—'}</td>
                  <td><button onClick={() => navigate(`/admin/subscriptions/detail?id=${s.id}`)} className="btn btn-ghost btn-icon btn-sm"><I.ChevronRight size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          )}
          <Pagination page={filters.page} pageSize={pageSize} total={total} pending={pending} onPage={(page) => update({ page })} />
        </div>
      </Page>
    </AdminShell>
  );
}

// === Global users (admins) ===

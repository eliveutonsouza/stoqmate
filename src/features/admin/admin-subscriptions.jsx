"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { AdminShell } from '@/components/ui/admin-shell';
import { PageHeader } from '@/components/layout/page-header';
import { PLATFORM } from '@/lib/plans';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { Toolbar } from '@/components/ui/toolbar';
import { StoreAvatar } from '@/components/domain/store-avatar';
import { PlanBadge } from '@/components/domain/plan-badge';
import { StatusBadge } from '@/components/domain/status-badge';
import { brl } from '@/lib/format';

export function AdminSubscriptions() {
  const navigate = useNavigate();
  const subs = [
    { store: 'TechPoint', plan: 'Rede', status: 'active', value: 1953, cycle: 'mensal', next: '01 out 2026', method: '•••• 4242', ltv: 11920 },
    { store: 'Farmácia Vida', plan: 'Rede', status: 'active', value: 1674, cycle: 'anual', next: '15 nov 2026', method: 'Boleto', ltv: 16390 },
    { store: 'Bonsucesso Varejo', plan: 'Controle', status: 'active', value: 447, cycle: 'mensal', next: '01 out 2026', method: '•••• 4242', ltv: 6230 },
    { store: 'Ferragens União', plan: 'Controle', status: 'active', value: 298, cycle: 'mensal', next: '01 out 2026', method: '•••• 1881', ltv: 5340 },
    { store: 'Distribuidora Plaza', plan: 'Controle', status: 'past_due', value: 447, cycle: 'mensal', next: 'vencida em 01 set', method: '•••• 9027', ltv: 9790 },
    { store: 'Casa & Cia Decor', plan: 'Controle', status: 'active', value: 298, cycle: 'mensal', next: '04 out 2026', method: 'PIX', ltv: 4450 },
    { store: 'Mercado Bom Preço', plan: 'Controle', status: 'active', value: 447, cycle: 'mensal', next: '12 out 2026', method: '•••• 3310', ltv: 8010 },
    { store: 'Papelaria Central', plan: 'Balcão', status: 'active', value: 79, cycle: 'mensal', next: '01 out 2026', method: '•••• 7712', ltv: 2730 },
    { store: 'Boutique Alecrim', plan: 'Balcão', status: 'trial', value: 0, cycle: '—', next: 'trial até 02 out', method: '—', ltv: 0 },
    { store: 'Autopeças Norte', plan: 'Controle', status: 'trial', value: 0, cycle: '—', next: 'trial até 28 set', method: '—', ltv: 0 },
  ];
  return (
    <AdminShell route="/admin/subscriptions" breadcrumb={['Assinaturas']} navigate={navigate}>
      <PageHeader
        title="Assinaturas"
        sub={`${PLATFORM.nets} assinaturas · ${PLATFORM.fmt(PLATFORM.mrr)} de MRR · 3 inadimplentes`}
        actions={<button className="btn btn-outline btn-sm"><I.Download size={13} /> Exportar CSV</button>}
        tabs={[{ id: 'all', label: 'Todas · 127' }, { id: 'active', label: 'Ativas · 110' }, { id: 'trial', label: 'Trial · 14' }, { id: 'past_due', label: 'Inadimplentes · 3' }]}
        activeTab="all"
      />
      <Page>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
          {[
            { l: 'MRR', v: PLATFORM.fmt(PLATFORM.mrr), s: '+9,2% MoM', tone: 'up' },
            { l: 'ARR projetado', v: PLATFORM.fmt(PLATFORM.arr), s: 'base atual × 12' },
            { l: 'Ticket médio', v: PLATFORM.fmt(PLATFORM.perNet), s: `por rede/mês · ${PLATFORM.fmt(PLATFORM.perUnit)} por loja` },
            { l: 'Inadimplência', v: 'R$ 1.341', s: '3 assinaturas', tone: 'down' },
            { l: 'Conversão de trial', v: '68%', s: '+4pp vs trimestre', tone: 'up' },
          ].map((m, i) => (
            <div key={i} style={{ padding: '14px 16px', borderRight: i < 4 ? '1px solid var(--line)' : 'none' }}>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{m.l}</div>
              <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>{m.v}</div>
              <div style={{ fontSize: 10, marginTop: 2, color: m.tone === 'up' ? 'var(--success)' : m.tone === 'down' ? 'var(--danger)' : 'var(--fg-soft)', fontFamily: m.tone ? 'var(--font-mono)' : undefined }}>{m.s}</div>
            </div>
          ))}
        </div>

        <Toolbar placeholder="Buscar rede…" filters={[{ label: 'Plano', value: 'Todos' }, { label: 'Ciclo', value: 'Todos' }, { label: 'Método', value: 'Todos' }]} right={<span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>10 de 127</span>} />

        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Rede</th><th>Plano</th><th>Status</th><th>Ciclo</th>
                <th className="num">Valor</th><th>Próxima cobrança</th><th>Pagamento</th><th className="num">LTV</th><th style={{ width: 30 }}></th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s, i) => (
                <tr key={i}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <StoreAvatar name={s.store} />
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{s.store}</span>
                    </div>
                  </td>
                  <td><PlanBadge plan={s.plan} /></td>
                  <td><StatusBadge status={s.status} /></td>
                  <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{s.cycle}</td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{s.value ? brl(s.value) : '—'}</td>
                  <td style={{ fontSize: 12, color: s.status === 'past_due' ? 'var(--danger)' : 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{s.next}</td>
                  <td style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>{s.method}</td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500 }}>{s.ltv ? 'R$ ' + s.ltv.toLocaleString('pt-BR') : '—'}</td>
                  <td><button className="btn btn-ghost btn-icon btn-sm"><I.More size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Page>
    </AdminShell>
  );
}

// === Global users (admins) ===

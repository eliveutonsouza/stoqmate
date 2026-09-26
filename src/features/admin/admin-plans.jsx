"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { AdminShell } from '@/components/ui/admin-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { PlanBadge } from '@/components/domain/plan-badge';
import { brl } from '@/lib/format';

export function AdminPlans({ plans }) {
  const navigate = useNavigate();
  const activeCount = plans.filter((p) => p.active).length;

  return (
    <AdminShell breadcrumb={['Planos']} navigate={navigate}>
      <PageHeader
        title="Planos"
        sub={`${activeCount} ativos · ${plans.length - activeCount} descontinuados`}
        actions={<button onClick={() => navigate('/admin/plans/new')} className="btn btn-primary btn-sm"><I.Plus size={13} /> Criar plano</button>}
      />
      <Page>
        <div className="card table-scroll">
          {plans.length === 0 ? (
            <div style={{ padding: '32px 18px', textAlign: 'center', fontSize: 13, color: 'var(--fg-muted)' }}>Nenhum plano cadastrado ainda.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Plano</th>
                  <th className="num">Mensal/loja</th><th className="num">Anual/loja</th><th className="num">Créditos</th>
                  <th className="num">SKUs</th><th className="num">Usuários</th><th className="num">Lojas</th><th className="num">Categorias</th>
                  <th>Status</th><th style={{ width: 30 }}></th>
                </tr>
              </thead>
              <tbody>
                {plans.map((p) => (
                  <tr key={p.id} style={{ opacity: p.active ? 1 : 0.55 }}>
                    <td><div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><PlanBadge plan={p.name} /><a href={`/admin/plans/edit?id=${p.id}`} onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; e.preventDefault(); navigate(`/admin/plans/edit?id=${p.id}`); }} style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</a>{p.popular && <span className="badge badge-accent">Mais escolhido</span>}</div></td>
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{brl(p.monthly_price)}</td>
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{p.yearly_price ? brl(p.yearly_price) : '—'}</td>
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{p.credits ? p.credits.toLocaleString('pt-BR') : '—'}</td>
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{p.limits?.skus ?? '∞'}</td>
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{p.limits?.users ?? '∞'}</td>
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{p.limits?.stores ?? '∞'}</td>
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{p.limits?.cats ?? '∞'}</td>
                    <td>{p.active ? <span className="badge badge-success"><span className="badge-dot"></span> Ativo</span> : <span className="badge">Descontinuado</span>}</td>
                    <td><button onClick={() => navigate(`/admin/plans/edit?id=${p.id}`)} className="btn btn-ghost btn-icon btn-sm"><I.More size={13} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>
          MRR e migração entre planos aparecem aqui quando a assinatura (Stripe) estiver configurada.
        </div>
      </Page>
    </AdminShell>
  );
}

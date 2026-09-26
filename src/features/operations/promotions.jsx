"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { unstable_rethrow, useRouter } from 'next/navigation';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { CategoryBadge } from '@/components/ui/category-badge';
import { brl } from '@/lib/format';
import { setPromotionActiveAction } from '@/features/operations/promotions-actions';

function statusOf(p) {
  if (!p.active) return 'ended';
  if (p.until_stock) return 'active';
  const now = new Date();
  if (new Date(p.starts_at) > now) return 'scheduled';
  if (p.ends_at && new Date(p.ends_at) < now) return 'ended';
  return 'active';
}

export function Promotions({ promotions }) {
  const navigate = useNavigate();
  const router = useRouter();
  const [tab, setTab] = React.useState('all');
  const [pending, startTransition] = React.useTransition();
  const statusMap = { active: { label: 'Ativa', cls: 'badge-success' }, scheduled: { label: 'Agendada', cls: 'badge-info' }, ended: { label: 'Encerrada', cls: 'badge' } };

  const withStatus = promotions.map((p) => ({ ...p, status: statusOf(p) }));
  const rows = tab === 'all' ? withStatus : withStatus.filter((p) => p.status === tab);
  const counts = {
    all: withStatus.length,
    active: withStatus.filter((p) => p.status === 'active').length,
    scheduled: withStatus.filter((p) => p.status === 'scheduled').length,
    ended: withStatus.filter((p) => p.status === 'ended').length,
  };

  const [error, setError] = React.useState('');

  const toggle = (p) => startTransition(async () => {
    setError('');
    try {
      const result = await setPromotionActiveAction({ id: p.id, active: !p.active });
      if (result?.error) { setError(result.error); return; }
      router.refresh();
    } catch (e) {
      unstable_rethrow(e);
      setError('Não foi possível salvar. Verifique a conexão e tente de novo.');
    }
  });

  return (
    <StoreShell route="/promotions" breadcrumb={['Promoções']} navigate={navigate}>
      <PageHeader
        title="Promoções"
        sub={`${counts.active} ativas · ${counts.scheduled} agendadas`}
        actions={<button onClick={() => navigate('/promotions/new')} className="btn btn-primary btn-sm"><I.Plus size={13} /> Criar promoção</button>}
        tabs={[
          { id: 'all', label: `Todas · ${counts.all}` },
          { id: 'active', label: `Ativas · ${counts.active}` },
          { id: 'scheduled', label: `Agendadas · ${counts.scheduled}` },
          { id: 'ended', label: `Encerradas · ${counts.ended}` },
        ]}
        activeTab={tab}
        onTab={setTab}
      />
      <Page>
        {error && (
          <div role="alert" style={{ padding: '10px 12px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 7, fontSize: 12 }}>{error}</div>
        )}
        <div className="card table-scroll">
          {rows.length === 0 ? (
            <div style={{ padding: '32px 18px', textAlign: 'center', fontSize: 13, color: 'var(--fg-muted)' }}>Nenhuma promoção aqui.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Promoção</th><th>Abrangência</th><th>Vigência</th>
                  <th className="num">De</th><th className="num">Por</th><th className="num">Desconto</th><th>Status</th><th style={{ width: 100 }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const original = p.product?.sale_price ?? null;
                  const off = original ? ((original - p.promo_price) / original) * 100 : null;
                  const st = statusMap[p.status];
                  return (
                    <tr key={p.id}>
                      <td><a href={`/promotions/edit?id=${p.id}`} onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; e.preventDefault(); navigate(`/promotions/edit?id=${p.id}`); }} style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</a></td>
                      <td>
                        {p.scope_type === 'product' && p.product ? (
                          <span style={{ fontSize: 12 }}>{p.product.sku} · {p.product.name}</span>
                        ) : p.scope_type === 'category' && p.category ? (
                          <CategoryBadge category={p.category} />
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>Toda a loja</span>
                        )}
                      </td>
                      <td style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>
                        {new Date(p.starts_at).toLocaleDateString('pt-BR')}{p.ends_at ? ` – ${new Date(p.ends_at).toLocaleDateString('pt-BR')}` : p.until_stock ? ' – estoque' : ' – sem fim'}
                      </td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)', textDecoration: original ? 'line-through' : 'none' }}>
                        {original ? brl(original) : '—'}
                      </td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500 }}>{brl(p.promo_price)}</td>
                      <td className="num">
                        {off !== null ? <span className="badge badge-accent">−{off.toFixed(0)}%</span> : <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>—</span>}
                      </td>
                      <td><span className={`badge ${st.cls}`}>{p.status === 'active' && <span className="badge-dot"></span>} {st.label}</span></td>
                      <td>
                        {/* Vencida pela data: reativar não muda nada — a vigência não se edita, só se cria outra. */}
                        {!p.until_stock && p.ends_at && new Date(p.ends_at) < new Date() ? (
                          <button onClick={() => navigate(`/promotions/edit?id=${p.id}`)} className="btn btn-ghost btn-sm">Detalhes</button>
                        ) : (
                          <button onClick={() => toggle(p)} disabled={pending} className="btn btn-outline btn-sm">
                            {p.active ? 'Encerrar' : 'Reativar'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Page>
    </StoreShell>
  );
}

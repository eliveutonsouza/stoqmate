"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { AdminShell } from '@/components/ui/admin-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Page } from '@/components/ui/page-container';
import { PlanBadge } from '@/components/domain/plan-badge';

// "2026-09-01" (date puro, sem hora) vira meia-noite UTC — em fuso atrás de
// UTC isso exibe o mês anterior. Mês/ano vêm direto da string, sem passar
// por Date/fuso nenhum.
const fmtMonth = (isoDate) => {
  const [year, month] = isoDate.split('-');
  const label = new Date(2000, Number(month) - 1, 1).toLocaleDateString('pt-BR', { month: 'short' });
  return `${label} de ${year.slice(2)}`;
};

export function AdminReports({ reports }) {
  const navigate = useNavigate();
  const { cohorts, growth, usageByPlan } = reports;
  const maxG = Math.max(1, ...growth.map((g) => g.new_tenants));

  const totalNew = growth.reduce((s, g) => s + g.new_tenants, 0);
  const totalCanceled = growth.reduce((s, g) => s + g.canceled_tenants, 0);
  const totalSkus = usageByPlan.reduce((s, p) => s + p.avgSkus * p.tenantCount, 0);
  const totalMoves = usageByPlan.reduce((s, p) => s + p.movements30d, 0);
  const totalTenants = usageByPlan.reduce((s, p) => s + p.tenantCount, 0);
  const avgRetentionM1 = cohorts.filter((c) => c.m1 != null).length
    ? Math.round(cohorts.filter((c) => c.m1 != null).reduce((s, c) => s + Number(c.m1), 0) / cohorts.filter((c) => c.m1 != null).length)
    : null;

  return (
    <AdminShell route="/admin/reports" breadcrumb={['Relatórios']} navigate={navigate}>
      <PageHeader title="Relatórios da plataforma" sub={`Adoção, retenção e uso agregado das ${totalTenants} rede(s)`} />
      <Page>
        <div className="g5 kpi-strip">
          {[
            { l: 'Novas redes · 12m', v: `${totalNew}`, s: `${(totalNew / 12).toFixed(1)}/mês em média` },
            { l: 'Cancelamentos · 12m', v: `${totalCanceled}` },
            { l: 'Retenção mês 1', v: avgRetentionM1 == null ? '—' : `${avgRetentionM1}%`, s: avgRetentionM1 == null ? 'nenhuma coorte com 1 mês ainda' : 'coorte média' },
            { l: 'SKUs na plataforma', v: totalSkus.toLocaleString('pt-BR') },
            { l: 'Movimentações · 30d', v: totalMoves.toLocaleString('pt-BR') },
          ].map((m, i) => (
            <div key={i} style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{m.l}</div>
              <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>{m.v}</div>
              {m.s && <div style={{ fontSize: 10, marginTop: 2, color: 'var(--fg-soft)' }}>{m.s}</div>}
            </div>
          ))}
        </div>

        <div className="g2">
          <div className="card" style={{ padding: 'var(--density-card-pad)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Novas redes vs. cancelamentos</h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Últimos 12 meses — o log só existe a partir de hoje, meses antigos aparecem zerados.</p>
              </div>
              <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--fg-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: 'var(--accent)' }}></span> Novas</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: 'var(--danger)' }}></span> Canceladas</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', height: 170, paddingBottom: 22 }}>
              {growth.map((g) => (
                <div key={g.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end', position: 'relative' }}>
                  <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>+{g.new_tenants - g.canceled_tenants}</span>
                  <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', width: '100%', height: '100%' }}>
                    <div style={{ flex: 1, height: `${(g.new_tenants / maxG) * 100}%`, background: 'var(--accent)', borderRadius: '3px 3px 0 0', minHeight: g.new_tenants ? 3 : 0 }}></div>
                    <div style={{ flex: 1, height: `${(g.canceled_tenants / maxG) * 100}%`, background: 'var(--danger)', borderRadius: '3px 3px 0 0', minHeight: g.canceled_tenants ? 3 : 0 }}></div>
                  </div>
                  <span style={{ position: 'absolute', bottom: -18, fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--fg-soft)' }}>{fmtMonth(g.month)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card table-scroll">
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Retenção por coorte</h3>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>% de redes ainda ativas após N meses. Célula vazia = ainda não deu tempo de medir.</p>
            </div>
            {cohorts.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', fontSize: 12.5, color: 'var(--fg-muted)' }}>Nenhuma coorte ainda.</div>
            ) : (
              <table className="table">
                <thead><tr><th>Coorte</th><th className="num">Redes</th><th className="num">Mês 1</th><th className="num">Mês 2</th><th className="num">Mês 3</th></tr></thead>
                <tbody>
                  {cohorts.map((c) => (
                    <tr key={c.cohort_month}>
                      <td style={{ fontSize: 12, fontWeight: 500 }}>{fmtMonth(c.cohort_month)}</td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{c.tenants_count}</td>
                      {[c.m0, c.m1, c.m2].map((v, j) => (
                        <td key={j} className="num">
                          {v == null ? <span style={{ color: 'var(--fg-soft)', fontSize: 11 }}>—</span> : (
                            <span style={{
                              display: 'inline-block', minWidth: 42, textAlign: 'center',
                              padding: '2px 6px', borderRadius: 4,
                              fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500,
                              background: `color-mix(in srgb, var(--accent) ${Math.round((Number(v) / 100) * 22)}%, transparent)`,
                              color: Number(v) >= 90 ? 'var(--fg)' : 'var(--fg-muted)',
                            }}>{v}%</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="card table-scroll">
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Uso agregado por plano</h3>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Ajuda a identificar redes prontas para upgrade.</p>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Plano</th><th className="num">Redes</th>
                <th className="num">SKUs médios</th><th className="num">Limite de SKUs</th>
                <th style={{ width: '20%' }}>Uso médio do limite</th>
                <th className="num">Usuários médios</th><th className="num">Mov./30d</th><th className="num">Perto do limite</th>
              </tr>
            </thead>
            <tbody>
              {usageByPlan.map((r) => (
                <tr key={r.planId}>
                  <td><PlanBadge plan={r.planName} /></td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.tenantCount}</td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.avgSkus}</td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{r.skuLimit ?? '∞'}</td>
                  <td>
                    {r.skuLimit ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{ flex: 1, height: 4, background: 'var(--bg-sunken)', borderRadius: 2 }}>
                          <div style={{ width: `${Math.min(100, (r.avgSkus / r.skuLimit) * 100)}%`, height: '100%', background: 'var(--warning)', borderRadius: 2 }}></div>
                        </div>
                        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--warning)' }}>{((r.avgSkus / r.skuLimit) * 100).toFixed(0)}%</span>
                      </div>
                    ) : <span style={{ fontSize: 12, color: 'var(--fg-soft)' }}>sem limite</span>}
                  </td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.avgUsers}</td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.movements30d}</td>
                  <td className="num">
                    {r.nearLimitCount > 0
                      ? <span className="badge badge-warning">{r.nearLimitCount} rede(s)</span>
                      : <span style={{ color: 'var(--fg-soft)', fontSize: 12 }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Page>
    </AdminShell>
  );
}

// === Platform settings ===

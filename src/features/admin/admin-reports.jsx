"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { AdminShell } from '@/components/ui/admin-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { PlanBadge } from '@/components/domain/plan-badge';

export function AdminReports() {
  const navigate = useNavigate();
  const cohorts = [
    { month: 'Abr 2026', signups: 22, m1: 100, m2: 91, m3: 86 },
    { month: 'Mar 2026', signups: 18, m1: 100, m2: 94, m3: 89 },
    { month: 'Fev 2026', signups: 24, m1: 100, m2: 88, m3: 83 },
    { month: 'Jan 2026', signups: 16, m1: 100, m2: 94, m3: 88 },
    { month: 'Dez 2025', signups: 14, m1: 100, m2: 86, m3: 79 },
    { month: 'Nov 2025', signups: 19, m1: 100, m2: 90, m3: 84 },
  ];
  const growth = [
    { m: 'Abr', new: 22, churn: 3 }, { m: 'Mai', new: 19, churn: 2 },
    { m: 'Jun', new: 24, churn: 4 }, { m: 'Jul', new: 21, churn: 2 },
    { m: 'Ago', new: 26, churn: 3 }, { m: 'Set', new: 14, churn: 3 },
  ];
  const maxG = Math.max(...growth.map(g => g.new));

  return (
    <AdminShell route="/admin/reports" breadcrumb={['Relatórios']} navigate={navigate}>
      <PageHeader
        title="Relatórios da plataforma"
        sub="Adoção, retenção e uso agregado das 127 redes"
        actions={(
          <>
            <button className="btn btn-outline btn-sm"><I.Filter size={13} /> Últimos 6 meses <I.ChevronDown size={11} /></button>
            <button className="btn btn-outline btn-sm"><I.Download size={13} /> Exportar</button>
          </>
        )}
      />
      <Page>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
          {[
            { l: 'Novas redes · 6m', v: '126', s: '21/mês em média' },
            { l: 'Churn médio', v: '2,3%', s: '−0,4pp vs semestre', tone: 'up' },
            { l: 'Retenção 3 meses', v: '85%', s: 'coorte média' },
            { l: 'SKUs na plataforma', v: '262k', s: '824 por loja' },
            { l: 'Movimentações · 30d', v: '31.2k', s: '+14,2%', tone: 'up' },
          ].map((m, i) => (
            <div key={i} style={{ padding: '14px 16px', borderRight: i < 4 ? '1px solid var(--line)' : 'none' }}>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{m.l}</div>
              <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>{m.v}</div>
              <div style={{ fontSize: 10, marginTop: 2, color: m.tone === 'up' ? 'var(--success)' : 'var(--fg-soft)', fontFamily: m.tone ? 'var(--font-mono)' : undefined }}>{m.s}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card" style={{ padding: 'var(--density-card-pad)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Novas redes vs. cancelamentos</h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Crescimento líquido positivo em todos os meses.</p>
              </div>
              <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--fg-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: 'var(--accent)' }}></span> Novas</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: 'var(--danger)' }}></span> Churn</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 18, alignItems: 'flex-end', height: 170, paddingBottom: 22 }}>
              {growth.map(g => (
                <div key={g.m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end', position: 'relative' }}>
                  <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--success)' }}>+{g.new - g.churn}</span>
                  <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', width: '100%', height: '100%' }}>
                    <div style={{ flex: 1, height: `${(g.new / maxG) * 100}%`, background: 'var(--accent)', borderRadius: '3px 3px 0 0' }}></div>
                    <div style={{ flex: 1, height: `${(g.churn / maxG) * 100}%`, background: 'var(--danger)', borderRadius: '3px 3px 0 0' }}></div>
                  </div>
                  <span style={{ position: 'absolute', bottom: -18, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-soft)' }}>{g.m}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Retenção por coorte</h3>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>% de redes ainda ativas após N meses.</p>
            </div>
            <table className="table">
              <thead><tr><th>Coorte</th><th className="num">Lojas</th><th className="num">Mês 1</th><th className="num">Mês 2</th><th className="num">Mês 3</th></tr></thead>
              <tbody>
                {cohorts.map(c => (
                  <tr key={c.month}>
                    <td style={{ fontSize: 12, fontWeight: 500 }}>{c.month}</td>
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{c.signups}</td>
                    {[c.m1, c.m2, c.m3].map((v, j) => (
                      <td key={j} className="num">
                        <span style={{
                          display: 'inline-block', minWidth: 42, textAlign: 'center',
                          padding: '2px 6px', borderRadius: 4,
                          fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500,
                          background: `color-mix(in srgb, var(--accent) ${Math.round((v / 100) * 22)}%, transparent)`,
                          color: v >= 90 ? 'var(--fg)' : 'var(--fg-muted)',
                        }}>{v}%</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
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
                <th className="num">Usuários médios</th><th className="num">Mov./mês</th><th className="num">Perto do limite</th>
              </tr>
            </thead>
            <tbody>
              {[
                { p: 'Balcão', lojas: 34, skus: 342, limit: 500, users: 1.8, mov: 186, near: 9 },
                { p: 'Controle', lojas: 68, skus: 1204, limit: null, users: 5.4, mov: 848, near: 0 },
                { p: 'Rede', lojas: 25, skus: 3142, limit: null, users: 10.2, mov: 2612, near: 0 },
              ].map(r => (
                <tr key={r.p}>
                  <td><PlanBadge plan={r.p} /></td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.lojas}</td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.skus}</td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{r.limit ?? '∞'}</td>
                  <td>
                    {r.limit ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{ flex: 1, height: 4, background: 'var(--bg-sunken)', borderRadius: 2 }}>
                          <div style={{ width: `${(r.skus / r.limit) * 100}%`, height: '100%', background: 'var(--warning)', borderRadius: 2 }}></div>
                        </div>
                        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--warning)' }}>{((r.skus / r.limit) * 100).toFixed(0)}%</span>
                      </div>
                    ) : <span style={{ fontSize: 12, color: 'var(--fg-soft)' }}>sem limite</span>}
                  </td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.users}</td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.mov}</td>
                  <td className="num">
                    {r.near > 0
                      ? <span className="badge badge-warning">{r.near} redes</span>
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

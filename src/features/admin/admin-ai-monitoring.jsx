"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { layoutStyles } from '@/components/layout/layout-styles';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { PageHeader } from '@/components/layout/page-header';

const fmtDateTime = (iso) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
const fmtTokens = (n) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

export function AdminAIMonitoring({ monitoring }) {
  const navigate = useNavigate();
  const { kpis, byDay, byModelOp, recentLogs } = monitoring;
  const maxCost = Math.max(1, ...byDay.map((d) => d.cost));

  return (
    <div style={layoutStyles.appShell}>
      <AdminSidebar route="/admin/ai-monitoring" navigate={navigate} />
      <div style={layoutStyles.main}>
        <AppHeader breadcrumb={['Console', 'Monitor de IA']} navigate={navigate} contextSwitch="admin" />
        <div style={layoutStyles.content}>
          <PageHeader title="Monitor de consumo de IA" sub="Anthropic Claude Haiku 4.5 · custos, tokens e latência" />

          <div style={{ padding: '20px 28px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
              {[
                { l: 'Custo (últimas 500 chamadas)', v: `US$ ${kpis.totalCost.toFixed(2)}` },
                { l: 'Requisições', v: kpis.totalRequests.toLocaleString('pt-BR') },
                { l: 'Tokens', v: fmtTokens(kpis.totalTokens) },
                { l: 'Latência média', v: kpis.avgLatencyMs == null ? '—' : `${(kpis.avgLatencyMs / 1000).toFixed(1)}s`, sub: kpis.avgLatencyMs == null ? 'sem chamada medida ainda' : undefined },
              ].map((m, i) => (
                <div key={i} style={{ padding: '14px 16px', borderRight: i < 3 ? '1px solid var(--line)' : 'none' }}>
                  <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{m.l}</div>
                  <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>{m.v}</div>
                  {m.sub && <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', marginTop: 2, color: 'var(--fg-muted)' }}>{m.sub}</div>}
                </div>
              ))}
            </div>

            <div className="card" style={{ padding: 'var(--density-card-pad)' }}>
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Consumo diário</h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Custo (US$) por dia, últimas 500 chamadas registradas.</p>
              </div>
              {byDay.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', fontSize: 12.5, color: 'var(--fg-muted)' }}>Nenhuma chamada de IA registrada ainda.</div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 180, paddingBottom: 22, position: 'relative' }}>
                  {byDay.map((d) => (
                    <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch', height: '100%', justifyContent: 'flex-end', position: 'relative' }}>
                      <div style={{ height: `${(d.cost / maxCost) * 100}%`, background: 'var(--accent)', borderRadius: '3px 3px 0 0', minHeight: 4 }}></div>
                      <span style={{ position: 'absolute', bottom: -18, left: 0, right: 0, textAlign: 'center', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--fg-soft)' }}>{d.day.slice(5)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Custo por modelo e função</h3>
              </div>
              {byModelOp.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', fontSize: 12.5, color: 'var(--fg-muted)' }}>Nenhum dado ainda.</div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Modelo</th><th>Função</th><th className="num">Requisições</th>
                      <th className="num">Tokens</th><th className="num">Latência média</th><th className="num">Custo</th>
                      <th style={{ width: '18%' }}>Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byModelOp.map((m, i) => (
                      <tr key={i}>
                        <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, padding: '2px 7px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 4 }}>{m.model}</span></td>
                        <td style={{ fontSize: 13 }}>{m.op}</td>
                        <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{m.requests.toLocaleString('pt-BR')}</td>
                        <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{fmtTokens(m.tokens)}</td>
                        <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{m.avgLatencyMs == null ? '—' : `${(m.avgLatencyMs / 1000).toFixed(1)}s`}</td>
                        <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500 }}>US$ {m.cost.toFixed(3)}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, height: 4, background: 'var(--bg-sunken)', borderRadius: 2 }}>
                              <div style={{ width: `${kpis.totalCost > 0 ? (m.cost / kpis.totalCost) * 100 : 0}%`, height: '100%', background: 'var(--accent)', borderRadius: 2 }}></div>
                            </div>
                            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)', minWidth: 28, textAlign: 'right' }}>{kpis.totalCost > 0 ? Math.round((m.cost / kpis.totalCost) * 100) : 0}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Últimas chamadas</h3>
                <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--fg-muted)' }}>50 mais recentes, de qualquer rede.</p>
              </div>
              {recentLogs.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', fontSize: 12.5, color: 'var(--fg-muted)' }}>Nenhuma chamada ainda.</div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: 110 }}>Quando</th><th>Rede</th><th>Função</th>
                      <th className="num">Tokens</th><th className="num">Custo</th><th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLogs.map((l, i) => (
                      <tr key={i}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)' }}>{fmtDateTime(l.created_at)}</td>
                        <td style={{ fontSize: 13 }}>{l.tenantName}</td>
                        <td style={{ fontSize: 12 }}>{l.opLabel}</td>
                        <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{((l.tokens_in ?? 0) + (l.tokens_out ?? 0)).toLocaleString('pt-BR')}</td>
                        <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>US$ {Number(l.cost_usd ?? 0).toFixed(3)}</td>
                        <td>
                          {l.status === 'ok'
                            ? <span className="badge badge-success"><span className="badge-dot"></span> ok</span>
                            : <span className="badge badge-warning" title={l.error_message}><span className="badge-dot"></span> erro</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

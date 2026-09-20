"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { MOCK } from '@/lib/mock';
import { layoutStyles } from '@/components/layout/layout-styles';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';

export function AdminAIMonitoring() {
  const navigate = useNavigate();
  const maxCost = Math.max(...MOCK.aiUsage.map(d => d.cost));

  return (
    <div style={layoutStyles.appShell}>
      <AdminSidebar route="/admin/ai-monitoring" navigate={navigate} />
      <div style={layoutStyles.main}>
        <AppHeader
          breadcrumb={['Console', 'Monitor de IA']}
          navigate={navigate}
          contextSwitch="admin"
          actions={(
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--fg-muted)' }}>
              <span className="pulse"></span>
              <span>Streaming · 14h42</span>
            </div>
          )}
        />
        <div style={layoutStyles.content}>
          <PageHeader
            title="Monitor de consumo de IA"
            sub="OpenAI · custos, tokens e latência em tempo real"
            actions={(
              <>
                <button className="btn btn-outline btn-sm"><I.Filter size={13} /> Maio 2026 <I.ChevronDown size={11} /></button>
                <button className="btn btn-outline btn-sm"><I.Download size={13} /> Exportar logs</button>
                <button className="btn btn-primary btn-sm"><I.Sparkle size={13} /> Definir alerta</button>
              </>
            )}
          />

          <div style={{ padding: '20px 28px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
              {[
                { l: 'Custo no mês', v: 'US$ 1.284', sub: '+18,4% vs abr', tone: 'down' },
                { l: 'Projeção fim do mês', v: 'US$ 2.840', sub: 'no ritmo atual', tone: 'neutral' },
                { l: 'Requisições', v: '18.420', sub: '+12,1%', tone: 'up' },
                { l: 'Tokens', v: '4,2M', sub: '74% input · 26% output', tone: 'neutral' },
                { l: 'Latência média', v: '1.4s', sub: '+0,3s · degradado', tone: 'down' },
              ].map((m, i) => (
                <div key={i} style={{ padding: '14px 16px', borderRight: i < 4 ? '1px solid var(--line)' : 'none' }}>
                  <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{m.l}</div>
                  <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>{m.v}</div>
                  <div style={{
                    fontSize: 10, fontFamily: 'var(--font-mono)', marginTop: 2,
                    color: m.tone === 'up' ? 'var(--success)' : m.tone === 'down' ? 'var(--danger)' : 'var(--fg-muted)',
                  }}>{m.sub}</div>
                </div>
              ))}
            </div>

            {/* Alert banner */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 14px',
              background: 'var(--warning-soft)',
              border: '1px solid var(--warning)',
              borderRadius: 8,
              fontSize: 12,
            }}>
              <span style={{ color: 'var(--warning)' }}><I.Alert size={15} /></span>
              <span style={{ fontWeight: 500, color: 'var(--fg)' }}>Projeção acima do limite mensal</span>
              <span style={{ color: 'var(--fg-muted)' }}>· Projeção de US$ 2.840 ultrapassa o teto de US$ 2.500. Considere ativar rate-limit no plano Balcão.</span>
              <div style={{ flex: 1 }}></div>
              <button className="btn btn-outline btn-sm">Ver detalhes</button>
              <button className="btn btn-ghost btn-icon btn-sm"><I.X size={13} /></button>
            </div>

            {/* Chart */}
            <div className="card" style={{ padding: 'var(--density-card-pad)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Consumo diário</h3>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Custo (US$) e nº de requisições por dia.</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 180, paddingBottom: 22, position: 'relative' }}>
                {MOCK.aiUsage.map((d, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 0, height: '100%', justifyContent: 'flex-end', position: 'relative' }}>
                    <div style={{
                      height: `${(d.cost / maxCost) * 100}%`,
                      background: 'var(--accent)',
                      borderRadius: '3px 3px 0 0',
                      minHeight: 4,
                    }}></div>
                    <span style={{ position: 'absolute', bottom: -18, left: 0, right: 0, textAlign: 'center', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--fg-soft)' }}>{d.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Models breakdown */}
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Custo por modelo e função</h3>
                  <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--fg-muted)' }}>Total US$ 1.284 distribuído por modelo da OpenAI.</p>
                </div>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Modelo</th>
                    <th>Função</th>
                    <th className="num">Requisições</th>
                    <th className="num">Tokens</th>
                    <th className="num">Custo</th>
                    <th style={{ width: '24%' }}>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK.aiModels.map((m, i) => (
                    <tr key={i}>
                      <td>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: 11,
                          padding: '2px 7px', background: 'var(--bg-sunken)',
                          border: '1px solid var(--line)', borderRadius: 4,
                        }}>{m.model}</span>
                      </td>
                      <td style={{ fontSize: 13 }}>{m.label}</td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{m.requests.toLocaleString('pt-BR')}</td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{m.tokens}</td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500 }}>US$ {m.cost}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 4, background: 'var(--bg-sunken)', borderRadius: 2 }}>
                            <div style={{ width: `${m.share}%`, height: '100%', background: 'var(--accent)', borderRadius: 2 }}></div>
                          </div>
                          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)', minWidth: 28, textAlign: 'right' }}>{m.share}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Live logs */}
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 8 }}>
                    Logs ao vivo
                    <span className="pulse"></span>
                  </h3>
                  <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--fg-muted)' }}>Últimas chamadas à API da OpenAI.</p>
                </div>
                <button className="btn btn-outline btn-sm">Pausar streaming</button>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 90 }}>Timestamp</th>
                    <th>Loja</th>
                    <th>Modelo</th>
                    <th className="num">Tokens</th>
                    <th className="num">Custo</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK.recentLogs.map((l, i) => (
                    <tr key={i}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)' }}>{l.time}</td>
                      <td style={{ fontSize: 13 }}>{l.store}</td>
                      <td>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: 11,
                          padding: '1px 6px', background: 'var(--bg-sunken)',
                          border: '1px solid var(--line)', borderRadius: 4,
                        }}>{l.model}</span>
                      </td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{l.tokens.toLocaleString('pt-BR')}</td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>US$ {l.cost.toFixed(3)}</td>
                      <td>
                        {l.status === 'ok'
                          ? <span className="badge badge-success"><span className="badge-dot"></span> 200 OK</span>
                          : <span className="badge badge-warning"><span className="badge-dot"></span> 429 rate_limit</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

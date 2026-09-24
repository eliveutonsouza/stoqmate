"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { AI_FEATURES } from '@/features/ai/ai-constants';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { AIQuotaCard } from '@/features/ai/ai-quota-card';
import { SummaryRow } from '@/components/ui/summary-row';

export function AIHub({ quota, pendingCount }) {
  const navigate = useNavigate();

  return (
    <StoreShell route="/ai" breadcrumb={['Inteligência artificial']} navigate={navigate}>
      <PageHeader
        title="Inteligência artificial"
        sub="A IA propõe, você confirma. Nada entra no estoque sem uma pessoa aprovar."
        actions={(
          <button onClick={() => navigate('/ai/queue')} className="btn btn-outline btn-sm">
            <I.Check size={13} /> Fila de revisão
            {pendingCount > 0 && <span className="badge badge-accent" style={{ marginLeft: 4 }}>{pendingCount}</span>}
          </button>
        )}
      />
      <Page gap={20}>
        <div className="split-aside" style={{ '--aside': '320px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            {pendingCount > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', background: 'var(--accent-soft)',
                border: '1px solid var(--accent)', borderRadius: 8,
              }}>
                <span style={{ color: 'var(--accent-text)', flexShrink: 0 }}><I.Check size={15} /></span>
                <span style={{ fontSize: 12.5, color: 'var(--fg)', flex: 1, lineHeight: 1.5 }}>
                  <strong>{pendingCount} sugestõe{pendingCount === 1 ? '' : 's'} esperando revisão</strong> — nada foi aplicado ainda.
                </span>
                <button onClick={() => navigate('/ai/queue')} className="btn btn-primary btn-sm">Revisar agora</button>
              </div>
            )}

            <div>
              <div className="section-h"><h3>Recursos</h3></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {AI_FEATURES.map(f => {
                  const Ico = I[f.icon] || I.Sparkle;
                  return (
                    <div key={f.id} className="card" style={{ padding: 16, display: 'flex', gap: 13, alignItems: 'flex-start' }}>
                      <span style={{
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        background: 'var(--accent-soft)', color: 'var(--accent-text)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}><Ico size={16} /></span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.012em' }}>{f.name}</span>
                        <p style={{ margin: '5px 0 0', fontSize: 12.5, color: 'var(--fg-muted)', lineHeight: 1.5 }}>{f.what}</p>
                        <div style={{ display: 'flex', gap: 14, marginTop: 9, fontSize: 11, color: 'var(--fg-muted)' }}>
                          <span>Aparece em <strong style={{ color: 'var(--fg)', fontWeight: 500 }}>{f.where}</strong></span>
                        </div>
                      </div>
                      <button onClick={() => navigate(f.route)} className="btn btn-outline btn-sm" style={{ flexShrink: 0 }}>Abrir</button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div data-sticky style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 0 }}>
            <AIQuotaCard navigate={navigate} quota={quota} />

            {quota?.byFeature?.length > 0 && (
              <div className="card" style={{ padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 10 }}>Uso por recurso neste ciclo</div>
                {quota.byFeature.map((f) => (
                  <SummaryRow key={f.id} label={f.label} value={`${f.runs}× · ${f.used} créditos`} />
                ))}
              </div>
            )}

            <div style={{ padding: '12px 14px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 8, display: 'flex', gap: 10 }}>
              <span style={{ color: 'var(--fg-muted)', flexShrink: 0, marginTop: 1 }}><I.Shield size={14} /></span>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
                Seus dados não treinam modelos. As chamadas enviam apenas o necessário para a tarefa.
              </div>
            </div>
          </div>
        </div>
      </Page>
    </StoreShell>
  );
}

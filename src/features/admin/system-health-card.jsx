"use client";

const TONE = { ok: 'var(--success)', error: 'var(--danger)', unconfigured: 'var(--warning)' };
const LABEL = { ok: 'no ar', error: 'falhou', unconfigured: 'sem chave' };

export function SystemHealthCard({ health }) {
  const services = health?.services ?? [];
  const checkedAt = health?.checkedAt
    ? new Date(health.checkedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : null;
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Saúde dos serviços</h3>
        <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--fg-muted)' }}>
          {checkedAt ? `Verificado às ${checkedAt}, ao abrir o console.` : 'Sem verificação.'}
        </p>
      </div>
      <div>
        {services.map((s, i) => (
          <div key={s.name} title={s.detail ?? undefined} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 18px',
            borderBottom: i < services.length - 1 ? '1px solid var(--line-soft)' : 'none',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: TONE[s.status], flexShrink: 0 }}></span>
            <span style={{ fontSize: 13, fontWeight: 500, flex: 1, minWidth: 0 }} className="truncate">{s.name}</span>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>
              {s.latencyMs != null ? `${s.latencyMs}ms` : '—'}
            </span>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: TONE[s.status], minWidth: 58, textAlign: 'right' }}>{LABEL[s.status]}</span>
          </div>
        ))}
        {health?.aiCalls != null && (
          <div style={{ padding: '10px 18px', borderTop: '1px solid var(--line-soft)', fontSize: 11.5, color: 'var(--fg-muted)' }}>
            IA nas últimas 24h: {health.aiCalls} chamadas{health.aiErrors ? `, ${health.aiErrors} com erro` : ', nenhuma com erro'}.
          </div>
        )}
      </div>
    </div>
  );
}

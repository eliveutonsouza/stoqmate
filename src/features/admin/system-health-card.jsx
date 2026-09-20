"use client";


export function SystemHealthCard() {
  const services = [
    { name: 'API · Storefront', status: 'ok', latency: '42ms', uptime: '99.99%' },
    { name: 'API · Admin', status: 'ok', latency: '38ms', uptime: '99.99%' },
    { name: 'Banco · Postgres', status: 'ok', latency: '12ms', uptime: '99.97%' },
    { name: 'Storage · S3', status: 'ok', latency: '88ms', uptime: '100%' },
    { name: 'OpenAI · GPT-4o', status: 'degraded', latency: '1.8s', uptime: '99.2%' },
    { name: 'Stripe · Webhooks', status: 'ok', latency: '120ms', uptime: '99.95%' },
  ];
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Saúde dos serviços</h3>
        <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--fg-muted)' }}>Status nas últimas 24h.</p>
      </div>
      <div>
        {services.map((s, i) => {
          const ok = s.status === 'ok';
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 18px',
              borderBottom: i < services.length - 1 ? '1px solid var(--line-soft)' : 'none',
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: ok ? 'var(--success)' : 'var(--warning)',
                flexShrink: 0,
              }}></span>
              <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{s.name}</span>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>{s.latency}</span>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: ok ? 'var(--success)' : 'var(--warning)', minWidth: 50, textAlign: 'right' }}>{s.uptime}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

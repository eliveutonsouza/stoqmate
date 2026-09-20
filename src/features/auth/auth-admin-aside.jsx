"use client";


export function AuthAdminAside() {
  return (
    <div style={{ maxWidth: 400, width: '100%' }}>
      <div style={{ fontSize: 11, color: 'var(--fg-soft)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
        Status da plataforma
      </div>
      {[
        ['API · Storefront', 'ok', '42ms'],
        ['API · Admin', 'ok', '38ms'],
        ['Banco · Postgres', 'ok', '12ms'],
        ['OpenAI · GPT-4o', 'degraded', '1.8s'],
        ['Stripe · Webhooks', 'ok', '120ms'],
      ].map(([n, s, l]) => (
        <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 0', borderBottom: '1px solid var(--line)' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: s === 'ok' ? 'var(--success)' : 'var(--warning)' }}></span>
          <span style={{ fontSize: 13, flex: 1 }}>{n}</span>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>{l}</span>
        </div>
      ))}
      <div style={{ fontSize: 11, color: 'var(--fg-soft)', marginTop: 20, lineHeight: 1.6 }}>
        Sessões administrativas registram IP, dispositivo e toda ação de impersonate no log de auditoria.
      </div>
    </div>
  );
}

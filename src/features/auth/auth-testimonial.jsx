"use client";


export function AuthTestimonial() {
  return (
    <div style={{ maxWidth: 400 }}>
      <div style={{ fontSize: 19, lineHeight: 1.5, letterSpacing: '-0.015em', fontWeight: 500 }}>
        “Vendemos de eletrônico a alimento em quatro lojas. Era uma planilha por unidade. Hoje é um catálogo só, e o saldo de cada loja bate na conferência.”
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginTop: 24 }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'var(--accent-strong)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 600,
        }}>MS</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>Mariana Souza</div>
          <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>Proprietária · Bonsucesso Varejo, SP</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 40, paddingTop: 28, borderTop: '1px solid var(--line)' }}>
        {[['318', 'lojas ativas'], ['1,2M', 'itens controlados'], ['99,9%', 'uptime']].map(([v, l]) => (
          <div key={l}>
            <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{v}</div>
            <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

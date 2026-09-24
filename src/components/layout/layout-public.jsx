"use client";

import { I } from '@/components/icons';

export function LayoutPublic({ children, navigate, route }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--fg)' }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'color-mix(in srgb, var(--bg) 85%, transparent)',
        backdropFilter: 'saturate(150%) blur(12px)',
        borderBottom: '1px solid var(--line)',
      }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto', padding: '0 32px',
          height: 60, display: 'flex', alignItems: 'center', gap: 32
        }}>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <I.Brand size={22} />
            <I.Wordmark size={15} />
          </a>
          <nav style={{ display: 'flex', gap: 4, marginLeft: 12 }}>
            {[{ l: 'Produto', r: '/' }, { l: 'Planos', r: '/pricing' }, { l: 'Clientes', r: null }, { l: 'Ajuda', r: '/help' }].map(item => (
              <a key={item.l} href="#" onClick={(e) => { e.preventDefault(); if (item.r) navigate(item.r); }} style={{
                fontSize: 13,
                color: route === item.r && item.r !== '/' ? 'var(--fg)' : 'var(--fg-muted)',
                padding: '6px 10px', borderRadius: 6,
                fontWeight: route === item.r && item.r !== '/' ? 500 : 400,
              }}>{item.l}</a>
            ))}
          </nav>
          <div style={{ flex: 1 }}></div>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/login'); }} className="btn btn-ghost btn-sm">Entrar</a>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/signup'); }} className="btn btn-primary btn-sm">Testar grátis</a>
        </div>
      </header>
      {children}
      <footer style={{ borderTop: '1px solid var(--line)', marginTop: 80, padding: '40px 32px 28px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.4fr repeat(4, 1fr)', gap: 32 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
              <I.Brand size={22} />
              <I.Wordmark size={14} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--fg-soft)', lineHeight: 1.6, maxWidth: 260 }}>
              Controle de estoque por par, feito sob medida para o varejo de calçados.
            </div>
            <div style={{ marginTop: 18, display: 'flex', gap: 10, color: 'var(--fg-soft)', fontSize: 11 }}>
              <span>© 2026 Stoqmate</span><span>·</span><span>São Paulo, BR</span>
            </div>
          </div>
          {[
            { h: 'Produto', l: ['Recursos', 'Planos', 'Multi-loja', 'Mobile', 'Mudanças'] },
            { h: 'Empresa', l: ['Sobre', 'Clientes', 'Blog', 'Carreiras', 'Imprensa'] },
            { h: 'Suporte', l: ['Central de ajuda', 'Documentação', 'API', 'Status', 'Contato'] },
            { h: 'Legal', l: ['Termos', 'Privacidade', 'LGPD', 'Cookies', 'DPA'] },
          ].map(col => (
            <div key={col.h}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>{col.h}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {col.l.map(item => <li key={item} style={{ fontSize: 13, color: 'var(--fg-muted)' }}>{item}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}

// === Sidebar item ===

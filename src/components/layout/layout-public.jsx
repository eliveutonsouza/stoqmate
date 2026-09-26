"use client";

import * as React from 'react';
import { I } from '@/components/icons';

const NAV = [{ l: 'Produto', r: '/' }, { l: 'Planos', r: '/pricing' }];

// Rodapé só com destinos que existem sem login.
const FOOTER = [
  { h: 'Produto', l: [{ t: 'Visão geral', r: '/' }, { t: 'Planos', r: '/pricing' }] },
  { h: 'Conta', l: [{ t: 'Criar conta', r: '/signup' }, { t: 'Entrar', r: '/login' }, { t: 'Esqueci a senha', r: '/forgot-password' }] },
  { h: 'Legal', l: [{ t: 'Termos de uso', r: '/terms' }, { t: 'Privacidade', r: '/privacy' }] },
];

export function LayoutPublic({ children, navigate, route }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const go = (r) => (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    e.preventDefault(); setMenuOpen(false); navigate(r);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--fg)' }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'color-mix(in srgb, var(--bg) 85%, transparent)',
        backdropFilter: 'saturate(150%) blur(12px)',
        borderBottom: '1px solid var(--line)',
      }}>
        <div className="pub-header-row">
          <a href={'/'} onClick={go('/')} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <I.Brand size={22} />
            <I.Wordmark size={15} />
          </a>
          <nav className="pub-nav" style={{ display: 'flex', gap: 4, marginLeft: 12 }}>
            {NAV.map(item => (
              <a key={item.l} href={item.r} onClick={go(item.r)} style={{
                fontSize: 13,
                color: route === item.r && item.r !== '/' ? 'var(--fg)' : 'var(--fg-muted)',
                padding: '6px 10px', borderRadius: 6,
                fontWeight: route === item.r && item.r !== '/' ? 500 : 400,
              }}>{item.l}</a>
            ))}
          </nav>
          <div style={{ flex: 1 }}></div>
          <a href={'/login'} onClick={go('/login')} className="btn btn-ghost btn-sm pub-login">Entrar</a>
          <a href={'/signup'} onClick={go('/signup')} className="btn btn-primary btn-sm">Testar grátis</a>
          <button onClick={() => setMenuOpen((o) => !o)} className="btn btn-ghost btn-icon btn-sm show-tablet"
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen}>
            {menuOpen ? <I.X size={16} /> : <I.Menu size={16} />}
          </button>
        </div>
        {menuOpen && (
          <nav className="pub-menu">
            {NAV.filter((item) => item.r).map(item => (
              <a key={item.l} href={item.r} onClick={go(item.r)} style={{ fontSize: 14, padding: '10px 4px', color: 'var(--fg)' }}>{item.l}</a>
            ))}
            <a href={'/login'} onClick={go('/login')} style={{ fontSize: 14, padding: '10px 4px', color: 'var(--fg)' }}>Entrar</a>
          </nav>
        )}
      </header>
      {children}
      <footer style={{ borderTop: '1px solid var(--line)', marginTop: 80, padding: '40px var(--page-pad) 28px' }}>
        <div className="pub-footer" style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
              <I.Brand size={22} />
              <I.Wordmark size={14} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--fg-soft)', lineHeight: 1.6, maxWidth: 260 }}>
              Controle de estoque multi-loja com IA, para qualquer tipo de varejo.
            </div>
            <div style={{ marginTop: 18, display: 'flex', gap: 10, color: 'var(--fg-soft)', fontSize: 11 }}>
              <span>© 2026 Stoqmate</span><span>·</span><span>São Paulo, BR</span>
            </div>
          </div>
          {FOOTER.map(col => (
            <div key={col.h}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>{col.h}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {col.l.map(item => (
                  <li key={item.r}>
                    <a href={item.r} onClick={go(item.r)} style={{ fontSize: 13, color: 'var(--fg-muted)' }}>{item.t}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}

// === Sidebar item ===

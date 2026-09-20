"use client";

import * as React from 'react';
import { ShowcaseCtx } from '@/components/ui/showcase-frame';
import { I } from '@/components/icons';

export const STORE_COMMANDS = [
  { g: 'Ir para', l: 'Dashboard', r: '/dashboard', i: 'Home' },
  { g: 'Ir para', l: 'Catálogo', r: '/products', i: 'Box' },
  { g: 'Ir para', l: 'Estoque', r: '/stock', i: 'Activity' },
  { g: 'Ir para', l: 'Relatórios', r: '/reports', i: 'Chart' },
  { g: 'Ir para', l: 'Compras e reposição', r: '/purchase-orders', i: 'Truck' },
  { g: 'Ir para', l: 'Configurações', r: '/settings', i: 'Settings' },
  { g: 'Ações', l: 'Nova venda', r: '/stock/sale', i: 'Plus', k: 'V' },
  { g: 'Ações', l: 'Entrada de estoque', r: '/stock/entry', i: 'ArrowUp', k: 'E' },
  { g: 'Ações', l: 'Transferir entre lojas', r: '/stock/transfer', i: 'Swap', k: 'T' },
  { g: 'Ações', l: 'Cadastrar produto', r: '/products/new', i: 'Layers', k: 'N' },
  { g: 'Ações', l: 'Contagem de inventário', r: '/stock/count', i: 'Grid', k: 'C' },
  { g: 'Ações', l: 'Imprimir etiquetas', r: '/labels', i: 'QR' },
  { g: 'Ações', l: 'Exportar dados', r: '/exports', i: 'Download' },
  { g: 'Buscar', l: 'Abrir busca completa', r: '/search', i: 'Search' },
  { g: 'Buscar', l: 'Notificações', r: '/notifications', i: 'Bell' },
];

export const ADMIN_COMMANDS = [
  { g: 'Ir para', l: 'Console', r: '/admin', i: 'Home' },
  { g: 'Ir para', l: 'Redes', r: '/admin/stores', i: 'Store' },
  { g: 'Ir para', l: 'Planos', r: '/admin/plans', i: 'Layers' },
  { g: 'Ir para', l: 'Assinaturas', r: '/admin/subscriptions', i: 'Credit' },
  { g: 'Ir para', l: 'Monitor de IA', r: '/admin/ai-monitoring', i: 'Cpu' },
  { g: 'Ir para', l: 'Relatórios da plataforma', r: '/admin/reports', i: 'Chart' },
  { g: 'Ações', l: 'Nova rede', r: '/admin/stores/new', i: 'Plus' },
  { g: 'Ações', l: 'Novo plano', r: '/admin/plans/new', i: 'Plus' },
  { g: 'Ações', l: 'Convidar administrador', r: '/admin/users', i: 'Users' },
];

export function CommandPalette({ navigate, admin }) {
  const inShowcase = React.useContext(ShowcaseCtx);
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState('');
  const [sel, setSel] = React.useState(0);
  const all = admin ? ADMIN_COMMANDS : STORE_COMMANDS;

  const hits = q.trim()
    ? all.filter(c => (c.l + ' ' + c.g).toLowerCase().includes(q.trim().toLowerCase()))
    : all;

  React.useEffect(() => {
    if (inShowcase) return;
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault(); setOpen(o => !o); setQ(''); setSel(0);
      } else if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [inShowcase]);

  React.useEffect(() => { setSel(0); }, [q]);

  const run = (c) => { setOpen(false); navigate(c.r); };

  const onInputKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(s + 1, hits.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel(s => Math.max(s - 1, 0)); }
    else if (e.key === 'Enter' && hits[sel]) { e.preventDefault(); run(hits[sel]); }
  };

  if (inShowcase || !open) return null;

  let idx = -1;
  const groups = [...new Set(hits.map(h => h.g))];

  return (
    <div onClick={() => setOpen(false)} style={{
      position: 'fixed', inset: 0, zIndex: 1200,
      background: 'rgba(20, 18, 13, 0.4)', backdropFilter: 'blur(2px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '12vh',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: 540, maxWidth: '90vw',
        background: 'var(--bg-elev)', border: '1px solid var(--line)',
        borderRadius: 12, boxShadow: 'var(--shadow-lg)', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', maxHeight: '64vh',
      }}>
        <div style={{ position: 'relative', borderBottom: '1px solid var(--line)' }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-muted)' }}>
            <I.Search size={15} />
          </span>
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onInputKey}
            placeholder={admin ? 'Buscar redes, planos, ações…' : 'Buscar produtos, telas, ações…'}
            style={{
              width: '100%', height: 48, padding: '0 56px 0 40px',
              border: 'none', outline: 'none', background: 'transparent',
              fontSize: 14.5, color: 'var(--fg)', fontFamily: 'inherit',
            }} />
          <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}>
            <span className="kbd">esc</span>
          </span>
        </div>

        <div style={{ overflowY: 'auto', padding: '6px 0' }}>
          {hits.length === 0 ? (
            <div style={{ padding: '28px 18px', textAlign: 'center', fontSize: 13, color: 'var(--fg-muted)' }}>
              Nada encontrado para “{q}”.
              <div style={{ marginTop: 10 }}>
                <button onClick={() => { setOpen(false); navigate('/search'); }} className="btn btn-outline btn-sm">
                  Buscar no catálogo completo
                </button>
              </div>
            </div>
          ) : groups.map(g => (
            <div key={g}>
              <div style={{
                fontSize: 10, fontWeight: 500, color: 'var(--fg-muted)',
                textTransform: 'uppercase', letterSpacing: '0.06em', padding: '8px 16px 4px',
              }}>{g}</div>
              {hits.filter(h => h.g === g).map(c => {
                idx++;
                const active = idx === sel;
                const Ico = I[c.i] || I.ChevronRight;
                const myIdx = idx;
                return (
                  <button key={c.l} onClick={() => run(c)} onMouseEnter={() => setSel(myIdx)} style={{
                    display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left',
                    padding: '8px 16px', border: 'none',
                    background: active ? 'var(--accent-soft)' : 'transparent',
                    borderLeft: '2px solid ' + (active ? 'var(--accent)' : 'transparent'),
                  }}>
                    <span style={{ color: active ? 'var(--accent-text)' : 'var(--fg-muted)', display: 'flex', flexShrink: 0 }}>
                      <Ico size={14} />
                    </span>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: active ? 500 : 400, color: 'var(--fg)' }}>{c.l}</span>
                    {c.k && <span className="kbd">{c.k}</span>}
                    <span style={{ fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{c.r}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div style={{
          padding: '9px 16px', borderTop: '1px solid var(--line)', background: 'var(--bg-sunken)',
          display: 'flex', alignItems: 'center', gap: 14, fontSize: 11, color: 'var(--fg-muted)',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span className="kbd">↑</span><span className="kbd">↓</span> navegar</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span className="kbd">↵</span> abrir</span>
          <div style={{ flex: 1 }}></div>
          <span>{hits.length} {hits.length === 1 ? 'resultado' : 'resultados'}</span>
        </div>
      </div>
    </div>
  );
}

// Content container with standard padding

"use client";

import * as React from 'react';
import { createPortal } from 'react-dom';
import { I } from '@/components/icons';
import { ProductThumb } from '@/components/ui/product-thumb';
import { variantLabel } from '@/lib/attr-colors';
import { createClient } from '@/lib/supabase/client';

// Busca real (debounce 250ms) por sku/código de barras/marca/nome — usada
// por toda tela de movimentação de estoque. `storeId` decide de qual loja
// vem o saldo mostrado (o mesmo produto tem saldo diferente por loja).
//
// O dropdown de resultados vai por portal pro <body>: os cards que envolvem
// este componente (FormCard) usam overflow:hidden pra arredondar canto, o
// que cortaria um menu posicionado normal (position:absolute) — via portal,
// isso nunca acontece, em nenhuma tela que reusar este componente.
export function ProductPicker({ product, onSelect, onClear, storeId }) {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [searchedQuery, setSearchedQuery] = React.useState('');
  const [searchError, setSearchError] = React.useState(false);
  const [menuRect, setMenuRect] = React.useState(null);
  const wrapperRef = React.useRef(null);
  const loading = query.trim().length >= 2 && searchedQuery !== query;
  const showMenu = open && query.trim().length >= 2;

  React.useEffect(() => {
    if (query.trim().length < 2) return;
    let cancelled = false;
    const handle = setTimeout(async () => {
      const supabase = createClient();
      const term = query.trim().replace(/[%_]/g, '');
      const { data, error } = await supabase.rpc('fn_search_products', { p_term: term, p_limit: 8 });
      if (!cancelled) {
        setSearchError(Boolean(error));
        setResults(error ? [] : data ?? []);
        setSearchedQuery(query);
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(handle); };
  }, [query]);

  React.useEffect(() => {
    if (!showMenu) return;
    const updateRect = () => {
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (rect) setMenuRect({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    };
    updateRect();
    window.addEventListener('scroll', updateRect, true);
    window.addEventListener('resize', updateRect);
    return () => {
      window.removeEventListener('scroll', updateRect, true);
      window.removeEventListener('resize', updateRect);
    };
  }, [showMenu]);

  if (product) {
    const category = product.category ?? null;
    const stock = product.stock_balances
      ? (product.stock_balances.find((b) => b.store_id === storeId)?.qty ?? 0)
      : (product.stock ?? 0);
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 11,
        padding: '9px 11px',
        border: '1px solid var(--line-strong)',
        borderRadius: 6,
        background: 'var(--bg-elev)',
      }}>
        <ProductThumb category={category} brand={product.brand} attrs={product.attrs} size={34} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{product.brand} · {product.name}</div>
          <div style={{ fontSize: 11, color: 'var(--fg-muted)', display: 'flex', gap: 8, marginTop: 1 }}>
            <span className="mono">{product.sku}</span>
            <span>·</span>
            <span>{variantLabel(product.attrs || {})}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>Em estoque</div>
          <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-mono)', color: stock < (product.min_stock || 0) ? 'var(--warning)' : 'var(--fg)' }}>
            {stock} {category?.unit_plural}
          </div>
        </div>
        {onClear && <button onClick={onClear} className="btn btn-ghost btn-icon btn-sm"><I.X size={13} /></button>}
      </div>
    );
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-muted)', zIndex: 1 }}>
        <I.Search size={13} />
      </span>
      <input
        className="input"
        placeholder="Buscar por SKU, código de barras, marca ou nome…"
        style={{ paddingLeft: 31, height: 36 }}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {showMenu && menuRect && typeof document !== 'undefined' && createPortal(
        <div style={{
          position: 'fixed', top: menuRect.top, left: menuRect.left, width: menuRect.width, zIndex: 1000,
          background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,.16)', maxHeight: 320, overflowY: 'auto',
        }}>
          {loading ? (
            <div style={{ padding: '12px 14px', fontSize: 12.5, color: 'var(--fg-muted)' }}>Buscando…</div>
          ) : searchError ? (
            <div role="alert" style={{ padding: '12px 14px', fontSize: 12.5, color: 'var(--danger)' }}>Não foi possível buscar agora. Tente de novo.</div>
          ) : results.length === 0 ? (
            <div style={{ padding: '12px 14px', fontSize: 12.5, color: 'var(--fg-muted)' }}>Nenhum produto encontrado.</div>
          ) : (
            results.map((p) => (
              <button
                key={p.id}
                onMouseDown={(e) => { e.preventDefault(); onSelect(p); setQuery(''); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
                  padding: '9px 12px', borderBottom: '1px solid var(--line-soft)', background: 'transparent',
                }}
              >
                <ProductThumb category={p.category} brand={p.brand} attrs={p.attrs} size={26} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500 }}>{p.brand} · {p.name}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{p.sku}</div>
                </div>
              </button>
            ))
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}

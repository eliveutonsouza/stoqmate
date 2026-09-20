"use client";

import { I } from '@/components/icons';
import { catById } from '@/lib/mock';
import { ProductThumb } from '@/components/ui/product-thumb';
import { variantLabel } from '@/lib/attr-colors';

export function ProductPicker({ product, onClear }) {
  if (!product) {
    return (
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-muted)', zIndex: 1 }}>
          <I.Search size={13} />
        </span>
        <input className="input" placeholder="Buscar por SKU, código de barras, marca ou nome…" style={{ paddingLeft: 31, height: 36 }} />
      </div>
    );
  }
  const c = catById(product.cat);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 11,
      padding: '9px 11px',
      border: '1px solid var(--line-strong)',
      borderRadius: 6,
      background: 'var(--bg-elev)',
    }}>
      <ProductThumb cat={product.cat} brand={product.brand} attrs={product.attrs} size={34} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{product.brand} · {product.name}</div>
        <div style={{ fontSize: 11, color: 'var(--fg-muted)', display: 'flex', gap: 8, marginTop: 1 }}>
          <span className="mono">{product.sku}</span>
          <span>·</span>
          <span>{variantLabel(product.attrs)}</span>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>Em estoque</div>
        <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-mono)', color: product.stock < 5 ? 'var(--warning)' : 'var(--fg)' }}>
          {product.stock} {c.unitPlural}
        </div>
      </div>
      {onClear && <button onClick={onClear} className="btn btn-ghost btn-icon btn-sm"><I.X size={13} /></button>}
    </div>
  );
}

// Summary rows used in movement forms

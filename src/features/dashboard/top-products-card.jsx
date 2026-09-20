"use client";

import { MOCK, catById } from '@/lib/mock';
import { I } from '@/components/icons';
import { ProductThumb } from '@/components/ui/product-thumb';
import { variantLabel } from '@/lib/attr-colors';
import { CategoryBadge } from '@/components/ui/category-badge';

export function TopProductsCard({ navigate }) {
  const maxSold = Math.max(...MOCK.topProducts.map(p => p.sold));
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Mais vendidos · setembro</h3>
          <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--fg-muted)' }}>Ranking por unidades vendidas, todas as categorias.</p>
        </div>
        <button onClick={() => navigate('/reports/categories')} className="btn btn-ghost btn-sm">Ver tudo <I.ChevronRight size={12} /></button>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th style={{ width: 28 }}>#</th>
            <th>Produto</th>
            <th>Categoria</th>
            <th style={{ width: '26%' }}>Vendas</th>
            <th className="num">Receita</th>
            <th className="num">Estoque</th>
          </tr>
        </thead>
        <tbody>
          {MOCK.topProducts.map((p, i) => {
            const c = catById(p.cat);
            return (
              <tr key={i}>
                <td style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{i + 1}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ProductThumb cat={p.cat} brand={p.brand} attrs={p.attrs} size={26} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{p.brand} · {variantLabel(p.attrs)}</div>
                    </div>
                  </div>
                </td>
                <td><CategoryBadge cat={p.cat} /></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, height: 4, background: 'var(--bg-sunken)', borderRadius: 2 }}>
                      <div style={{ width: `${(p.sold / maxSold) * 100}%`, height: '100%', background: 'var(--accent)', borderRadius: 2 }}></div>
                    </div>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', minWidth: 56, textAlign: 'right', color: 'var(--fg-muted)' }}>
                      {p.sold} {c.unitPlural}
                    </span>
                  </div>
                </td>
                <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>R$ {p.revenue.toLocaleString('pt-BR')}</td>
                <td className="num">
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: p.stock < 70 ? 'var(--warning)' : 'var(--fg-muted)' }}>{p.stock}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

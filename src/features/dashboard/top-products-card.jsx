"use client";

import { I } from '@/components/icons';
import { EmptyState } from '@/components/ui/empty-state';

export function TopProductsCard({ navigate, topProducts }) {
  const maxSold = Math.max(1, ...topProducts.map((p) => p.units));
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Mais vendidos · 30 dias</h3>
          <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--fg-muted)' }}>Ranking por unidades vendidas, todas as categorias.</p>
        </div>
        <button onClick={() => navigate('/reports/categories')} className="btn btn-ghost btn-sm">Ver tudo <I.ChevronRight size={12} /></button>
      </div>
      {topProducts.length === 0 ? (
        <EmptyState icon={<I.Box size={18} />} title="Nenhuma venda no período" desc="Assim que houver vendas, o ranking aparece aqui." />
      ) : (
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
            {topProducts.map((p, i) => (
              <tr key={p.product_id}>
                <td style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{i + 1}</td>
                <td>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{p.brand} · {p.sku}</div>
                </td>
                <td>
                  <span style={{ fontSize: 11, color: 'var(--fg-muted)', padding: '2px 7px', background: 'var(--bg-sunken)', border: '1px solid var(--line-soft)', borderRadius: 4 }}>
                    {p.category_name}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, height: 4, background: 'var(--bg-sunken)', borderRadius: 2 }}>
                      <div style={{ width: `${(p.units / maxSold) * 100}%`, height: '100%', background: 'var(--accent)', borderRadius: 2 }}></div>
                    </div>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', minWidth: 40, textAlign: 'right', color: 'var(--fg-muted)' }}>
                      {p.units}
                    </span>
                  </div>
                </td>
                <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>R$ {Number(p.revenue).toLocaleString('pt-BR')}</td>
                <td className="num">
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: p.stock_qty < 20 ? 'var(--warning)' : 'var(--fg-muted)' }}>{p.stock_qty}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

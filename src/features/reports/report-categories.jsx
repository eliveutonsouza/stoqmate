"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { MOCK, catById } from '@/lib/mock';
import { StoreShell } from '@/components/ui/store-shell';
import { ReportHeader } from '@/components/domain/report-header';
import { Page } from '@/components/ui/page-container';
import { ReportTabs } from '@/components/domain/report-tabs';
import { DonutChart } from '@/components/domain/donut-chart';
import { CategoryBadge } from '@/components/ui/category-badge';
import { ProductThumb } from '@/components/ui/product-thumb';
import { brl } from '@/lib/format';

export function ReportCategories() {
  const navigate = useNavigate();
  const total = MOCK.categoryMix.reduce((s, c) => s + c.revenue, 0);
  const maxRev = Math.max(...MOCK.categoryMix.map(c => c.revenue));

  const products = [
    { cat: 'eletronicos', brand: 'Foneclear', name: 'Fone Bluetooth ANC', units: 184, revenue: 55020, variants: 8, margin: 47 },
    { cat: 'calcados', brand: 'Olympikus', name: 'Tênis Esporte 3', units: 148, revenue: 41412, variants: 24, margin: 40 },
    { cat: 'vestuario', brand: 'Malharia Sul', name: 'Camiseta Algodão Pima', units: 312, revenue: 27768, variants: 18, margin: 44 },
    { cat: 'alimentos', brand: 'Serra Alta', name: 'Café em Grãos', units: 428, revenue: 25680, variants: 8, margin: 32 },
    { cat: 'eletronicos', brand: 'Voltway', name: 'Carregador GaN 65W', units: 132, revenue: 24948, variants: 4, margin: 51 },
    { cat: 'casa', brand: 'Casa Viva', name: 'Jogo de Toalhas', units: 96, revenue: 18240, variants: 10, margin: 38 },
    { cat: 'calcados', brand: 'Terrano', name: 'Bota Couro Trilha', units: 38, revenue: 17442, variants: 12, margin: 43 },
    { cat: 'papelaria', brand: 'Norma', name: 'Caderno Pautado 200f', units: 386, revenue: 13124, variants: 8, margin: 36 },
  ];
  const maxUnits = Math.max(...products.map(p => p.units));

  return (
    <StoreShell route="/reports/categories" breadcrumb={['Relatórios', 'Categorias e produtos']} navigate={navigate}>
      <ReportHeader title="Categorias e produtos" sub="6 categorias · 142 marcas · 1.688 SKUs ativos no período" />
      <Page>
        <ReportTabs route="/reports/categories" navigate={navigate} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
          {[
            { l: 'Categoria líder em receita', v: 'Eletrônicos', s: '28,7% do faturamento' },
            { l: 'Categoria líder em volume', v: 'Vestuário', s: '1.284 peças vendidas' },
            { l: 'Maior margem', v: 'Eletrônicos', s: '47,4% média', tone: 'up' },
            { l: 'Menor giro', v: 'Casa & Decoração', s: '1,8× no período', tone: 'down' },
          ].map((m, i) => (
            <div key={i} style={{ padding: '14px 16px', borderRight: i < 3 ? '1px solid var(--line)' : 'none' }}>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{m.l}</div>
              <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.022em', marginTop: 4 }}>{m.v}</div>
              <div style={{ fontSize: 10, marginTop: 2, color: m.tone === 'up' ? 'var(--success)' : m.tone === 'down' ? 'var(--warning)' : 'var(--fg-muted)' }}>{m.s}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card" style={{ padding: 'var(--density-card-pad)' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Participação no faturamento</h3>
            <p style={{ margin: '0 0 20px', fontSize: 12, color: 'var(--fg-muted)' }}>Nenhuma categoria passa de 30% — o mix está distribuído.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <DonutChart size={150} thickness={22} segments={MOCK.categoryMix.map(m => ({ value: m.revenue, color: catById(m.id).cssVar }))} center={(
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>413k</div>
                  <div style={{ fontSize: 10, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>receita</div>
                </div>
              )} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {MOCK.categoryMix.map(m => {
                  const c = catById(m.id);
                  return (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <span style={{ width: 9, height: 9, borderRadius: 2, background: c.cssVar }}></span>
                      <span style={{ fontSize: 12, flex: 1 }}>{c.name}</span>
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>{((m.revenue / total) * 100).toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Desempenho por categoria</h3>
            </div>
            <table className="table">
              <thead>
                <tr><th>Categoria</th><th className="num">SKUs</th><th className="num">Vendidos</th><th className="num">Receita</th><th style={{ width: '22%' }}>Share</th></tr>
              </thead>
              <tbody>
                {MOCK.categoryMix.map(m => {
                  const c = catById(m.id);
                  return (
                    <tr key={m.id}>
                      <td><CategoryBadge cat={m.id} /></td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{c.skus}</td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{m.units.toLocaleString('pt-BR')}</td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>R$ {m.revenue.toLocaleString('pt-BR')}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 4, background: 'var(--bg-sunken)', borderRadius: 2 }}>
                            <div style={{ width: `${(m.revenue / maxRev) * 100}%`, height: '100%', background: c.cssVar, borderRadius: 2 }}></div>
                          </div>
                          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)', minWidth: 32, textAlign: 'right' }}>
                            {((m.revenue / total) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Top produtos da rede</h3>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Agregado de todas as variações de cada produto.</p>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 28 }}>#</th><th>Produto</th><th>Categoria</th>
                <th className="num">Variações</th>
                <th style={{ width: '20%' }}>Vendidos</th>
                <th className="num">Receita</th><th className="num">Ticket médio</th><th className="num">Margem</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => {
                const c = catById(p.cat);
                return (
                  <tr key={i}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)' }}>{i + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <ProductThumb cat={p.cat} brand={p.brand} attrs={{}} size={26} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{p.brand}</div>
                        </div>
                      </div>
                    </td>
                    <td><CategoryBadge cat={p.cat} /></td>
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{p.variants}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{ flex: 1, height: 4, background: 'var(--bg-sunken)', borderRadius: 2 }}>
                          <div style={{ width: `${(p.units / maxUnits) * 100}%`, height: '100%', background: 'var(--accent)', borderRadius: 2 }}></div>
                        </div>
                        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', minWidth: 52, textAlign: 'right', color: 'var(--fg-muted)' }}>
                          {p.units} {c.unit === 'unidade' ? 'un' : c.unit}
                        </span>
                      </div>
                    </td>
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>R$ {p.revenue.toLocaleString('pt-BR')}</td>
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{brl(p.revenue / p.units)}</td>
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: p.margin >= 45 ? 'var(--success)' : 'var(--fg-muted)' }}>{p.margin}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Page>
    </StoreShell>
  );
}

// === Attributes report: works for any schema, grouped by category ===

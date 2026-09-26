"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { I } from '@/components/icons';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Page } from '@/components/ui/page-container';
import { HubCard } from '@/components/domain/hub-card';
import { EmptyState } from '@/components/ui/empty-state';
import { brl } from '@/lib/format';

export function StockHub({ overview, categoryBalances, flowCounts, lowStockItems }) {
  const navigate = useNavigate();
  const maxStock = Math.max(1, ...categoryBalances.map((c) => c.qty));

  const flows = [
    { r: '/stock/entry', i: <I.ArrowUp size={15} />, t: 'Entrada', d: 'Compra recebida do fornecedor', k: 'entry' },
    { r: '/stock/sale', i: <I.ArrowDown size={15} />, t: 'Venda', d: 'Saída no balcão, com desconto', k: 'sale' },
    { r: '/stock/transfer', i: <I.Swap size={15} />, t: 'Transferência', d: 'Entre unidades da rede', k: 'transfer' },
    { r: '/stock/exchange', i: <I.ArrowRight size={15} />, t: 'Troca', d: 'Devolve um item, entrega outro', k: 'exchange' },
    { r: '/stock/return', i: <I.ArrowUp size={15} />, t: 'Devolução', d: 'Item volta ao estoque ou à avaria', k: 'return' },
    { r: '/stock/adjustment', i: <I.Activity size={15} />, t: 'Ajuste de inventário', d: 'Alinha sistema com contagem física', k: 'adjustment' },
  ];

  return (
    <StoreShell route="/stock" breadcrumb={['Estoque']} navigate={navigate}>
      <PageHeader
        title="Estoque"
        sub={`${overview.total_qty.toLocaleString('pt-BR')} itens · ${overview.sku_count} SKUs ativos`}
        actions={(
          <>
            <button onClick={() => navigate('/stock/history')} className="btn btn-outline btn-sm"><I.Activity size={13} /> Histórico</button>
            <button onClick={() => navigate('/stock/entry')} className="btn btn-outline btn-sm"><I.Plus size={13} /> Entrada</button>
            <button onClick={() => navigate('/stock/sale')} className="btn btn-primary btn-sm"><I.Plus size={13} /> Nova venda</button>
          </>
        )}
      />
      <Page gap={20}>
        <div className="g4 kpi-strip">
          {[
            { l: 'Itens em estoque', v: overview.total_qty.toLocaleString('pt-BR'), s: 'toda a rede' },
            ...(overview.total_cost_value == null ? [] : [{ l: 'Valor de custo', v: brl(overview.total_cost_value), s: 'a preço de custo' }]),
            { l: 'SKUs em ruptura', v: `${overview.rupture_count}`, s: 'saldo zerado', tone: overview.rupture_count > 0 ? 'danger' : undefined },
            { l: 'SKUs em alerta', v: `${overview.low_stock_count}`, s: 'abaixo do mínimo', tone: overview.low_stock_count > 0 ? 'warning' : undefined },
          ].map((m, i) => (
            <div key={i} style={{ padding: '16px 18px' }}>
              <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{m.l}</div>
              <div style={{
                fontSize: 22, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums', marginTop: 4,
                color: m.tone === 'danger' ? 'var(--danger)' : m.tone === 'warning' ? 'var(--warning)' : 'var(--fg)',
              }}>{m.v}</div>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 2 }}>{m.s}</div>
            </div>
          ))}
        </div>

        <div>
          <div className="section-h"><h3>Registrar movimentação</h3></div>
          <div className="g3" style={{ gap: 10 }}>
            {flows.map(f => (
              <HubCard key={f.r} icon={f.i} title={f.t} desc={f.d} accent onClick={() => navigate(f.r)} meta={[['30 dias', `${flowCounts[f.k] ?? 0}`]]} />
            ))}
          </div>
        </div>

        <div className="split-2" style={{ '--a': '1.2fr', '--b': '1fr', alignItems: 'stretch' }}>
          <div className="card" style={{ padding: 'var(--density-card-pad)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Saldo por categoria</h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Cada categoria conta na sua própria unidade de medida.</p>
              </div>
              <button onClick={() => navigate('/categories')} className="btn btn-ghost btn-sm">Categorias <I.ChevronRight size={12} /></button>
            </div>
            {categoryBalances.length === 0 ? (
              <EmptyState icon={<I.Box size={18} />} title="Nenhum saldo ainda" desc="O saldo por categoria aparece assim que houver estoque cadastrado." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {categoryBalances.map(c => {
                  const Ico = I[c.icon] || I.Box;
                  return (
                    <div key={c.id}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 5 }}>
                        <span style={{ color: c.color, display: 'flex' }}><Ico size={13} /></span>
                        <span style={{ fontSize: 12, flex: 1 }}>{c.name}</span>
                        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>{c.skuCount} SKUs</span>
                        <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', minWidth: 96, textAlign: 'right' }}>
                          {c.qty.toLocaleString('pt-BR')} {c.unit_plural}
                        </span>
                      </div>
                      <div style={{ height: 5, background: 'var(--bg-sunken)', borderRadius: 3 }}>
                        <div style={{ width: `${(c.qty / maxStock) * 100}%`, height: '100%', background: c.color, borderRadius: 3 }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 8 }}>
                Precisa de atenção
                {overview.low_stock_count > 0 && <span className="badge badge-warning"><I.Alert size={10} /> {overview.low_stock_count}</span>}
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Abaixo do mínimo definido no produto.</p>
            </div>
            {lowStockItems.length === 0 ? (
              <EmptyState icon={<I.Check size={18} />} title="Nada em alerta" desc="Todo o estoque está acima do mínimo." />
            ) : (
              <>
                {lowStockItems.map((p, i, arr) => (
                  <div key={p.id} style={{
                    display: 'flex', alignItems: 'center', gap: 11,
                    padding: '11px 18px',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--line-soft)' : 'none',
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 5, flexShrink: 0,
                      background: p.totalQty === 0 ? 'var(--danger-soft)' : 'var(--warning-soft)',
                      color: p.totalQty === 0 ? 'var(--danger)' : 'var(--warning)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 12,
                    }}>{p.totalQty}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500 }} className="truncate">{p.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{p.sku}</div>
                    </div>
                    <button onClick={() => navigate('/stock/entry')} className="btn btn-outline btn-sm">Repor</button>
                  </div>
                ))}
                {overview.low_stock_count > lowStockItems.length && (
                  <div style={{ padding: '10px 18px', background: 'var(--bg-sunken)', borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>+{overview.low_stock_count - lowStockItems.length} outros itens</span>
                    <a href="/products" onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; e.preventDefault(); navigate('/products'); }} style={{ fontSize: 11, color: 'var(--accent-text)', fontWeight: 500 }}>Ver no catálogo →</a>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Page>
    </StoreShell>
  );
}

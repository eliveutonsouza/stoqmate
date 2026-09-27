"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { useQueryUpdate } from '@/hooks/use-query-update';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { Toolbar } from '@/components/ui/toolbar';
import { Pagination } from '@/components/ui/pagination';
import { MOVEMENT_TYPES } from '@/lib/movement-types';
import { CategoryBadge } from '@/components/ui/category-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { brl } from '@/lib/format';
import { downloadCsv, csvFilename } from '@/lib/csv';
import { exportStockHistoryCsvAction } from '@/features/stock/history-actions';
import { useCan } from '@/hooks/use-can';

// Busca (?q), tipo (?kind), loja (?store) e página (?page) na URL — o
// servidor filtra e pagina (fn_stock_movements_list).
export function StockHistory({ filters, pageSize, rows, total, allTotal, kinds, kpis, stores }) {
  const navigate = useNavigate();
  const canGo = useCan();
  const { update, pending } = useQueryUpdate();
  const [exporting, startExport] = React.useTransition();
  const [notice, setNotice] = React.useState(null);

  const kindsTotal = kinds.reduce((s, k) => s + k.count, 0);
  const hasFilters = !!(filters.q || filters.kind || filters.store);
  const activeStore = filters.store ? stores.find((s) => s.id === filters.store) : null;

  const exportCsv = () => {
    setNotice(null);
    startExport(async () => {
      const result = await exportStockHistoryCsvAction({ q: filters.q, kind: filters.kind, store: filters.store });
      if (result?.error) { setNotice({ tone: 'danger', text: result.error }); return; }
      downloadCsv(csvFilename('movimentacoes'), result.csv);
      if (result.truncated) {
        setNotice({ tone: 'warning', text: `Exportadas as ${result.exported.toLocaleString('pt-BR')} movimentações mais recentes de ${result.total.toLocaleString('pt-BR')}. Filtre por loja, tipo ou produto para exportar o restante.` });
      }
    });
  };

  return (
    <StoreShell route="/stock/history" breadcrumb={['Estoque', 'Histórico']} navigate={navigate}>
      <PageHeader
        title="Movimentações"
        sub={`Tudo que entrou, saiu ou mudou de loja · ${allTotal.toLocaleString('pt-BR')} registro${allTotal === 1 ? '' : 's'}`}
        actions={(
          <>
            <button onClick={exportCsv} disabled={total === 0 || exporting} className="btn btn-outline btn-sm">
              <I.Download size={13} /> {exporting ? 'Exportando…' : 'Exportar CSV'}
            </button>
            {canGo('/stock/entry') && (<button onClick={() => navigate('/stock/entry')} className="btn btn-primary btn-sm"><I.Plus size={13} /> Nova movimentação</button>)}
          </>
        )}
        tabs={allTotal === 0 ? undefined : [
          { id: 'all', label: `Todas · ${kindsTotal}` },
          ...kinds.map((k) => ({ id: k.kind, label: `${MOVEMENT_TYPES[k.kind]?.label ?? k.kind} · ${k.count}` })),
          // Tipo escolhido pela URL que não tem nenhum registro no filtro atual continua visível como aba ativa.
          ...(filters.kind && !kinds.some((k) => k.kind === filters.kind)
            ? [{ id: filters.kind, label: `${MOVEMENT_TYPES[filters.kind]?.label ?? filters.kind} · 0` }]
            : []),
        ]}
        activeTab={filters.kind ?? 'all'}
        onTab={(id) => update({ kind: id === 'all' ? null : id })}
      />

      <Page>
        {allTotal === 0 ? (
          <EmptyState
            icon={<I.Activity size={18} />}
            title="Nenhuma movimentação registrada ainda"
            desc="Entradas, transferências, ajustes e contagens aparecem aqui assim que forem confirmados."
            action={canGo('/stock/entry') ? <button onClick={() => navigate('/stock/entry')} className="btn btn-primary btn-sm"><I.Plus size={12} /> Nova entrada</button> : null}
          />
        ) : (
          <>
            <div className="g3 kpi-strip">
              {[
                { l: 'Entradas (unidades)', v: `+${kpis.qtyIn.toLocaleString('pt-BR')}` },
                { l: 'Saídas (unidades)', v: kpis.qtyOut.toLocaleString('pt-BR') },
                { l: 'Transferências', v: kpis.transfers.toLocaleString('pt-BR') },
              ].map((s, i) => (
                <div key={i} style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{s.l}</div>
                  <div style={{ fontSize: 18, fontWeight: 600, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', marginTop: 4 }}>{s.v}</div>
                </div>
              ))}
            </div>

            <Toolbar
              placeholder="Buscar por SKU, código de barras ou produto…"
              value={filters.q ?? ''}
              onChange={(q) => update({ q })}
              debounce={300}
              filters={stores.length > 1 ? [{
                label: 'Unidade', value: activeStore?.name ?? 'Todas', active: !!filters.store,
                selected: filters.store ?? '',
                options: [{ value: '', label: 'Todas' }, ...stores.map((s) => ({ value: s.id, label: s.name }))],
                onChange: (v) => update({ store: v || null }),
              }] : []}
              right={<span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{total.toLocaleString('pt-BR')} de {allTotal.toLocaleString('pt-BR')}</span>}
            />

            {notice && (
              <div role="status" style={{ padding: '10px 12px', background: `var(--${notice.tone}-soft)`, border: `1px solid var(--${notice.tone})`, borderRadius: 7, fontSize: 12 }}>
                {notice.text}
              </div>
            )}

            <div className="card" style={{ opacity: pending ? 0.6 : 1, transition: 'opacity .15s' }}>
              {rows.length === 0 ? (
                <div style={{ padding: '32px 18px', textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>Nenhuma movimentação encontrada</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 4 }}>
                    {total > 0 ? 'Esta página não existe mais.' : 'Nada bate com a busca e os filtros atuais.'}
                  </div>
                  {total > 0
                    ? <button type="button" onClick={() => update({ page: null })} className="btn btn-outline btn-sm" style={{ marginTop: 12 }}>Primeira página</button>
                    : hasFilters && <button type="button" onClick={() => update({ q: null, kind: null, store: null })} className="btn btn-outline btn-sm" style={{ marginTop: 12 }}>Limpar filtros</button>}
                </div>
              ) : (
                <div className="table-scroll">
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ width: 140 }}>Data/hora</th>
                        <th style={{ width: 130 }}>Tipo</th>
                        <th>Produto</th>
                        <th>Categoria</th>
                        <th>Unidade</th>
                        <th className="num">Qtd</th>
                        <th className="num">Custo un.</th>
                        <th>Motivo</th>
                        <th style={{ width: 40 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((m) => {
                        const t = MOVEMENT_TYPES[m.kind] ?? MOVEMENT_TYPES.adjustment;
                        return (
                          <tr key={m.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/stock/movement?id=${m.id}`)}>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)' }}>
                              {new Date(m.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                padding: '2px 7px', borderRadius: 4,
                                background: t.soft, color: t.color, fontSize: 11, fontWeight: 500,
                              }}>{t.icon} {t.label}</span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: 13 }}>{m.product?.name ?? '—'}</span>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-muted)' }}>{m.product?.sku}</span>
                              </div>
                            </td>
                            <td>{m.product?.category && <CategoryBadge category={m.product.category} />}</td>
                            <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{m.store?.name}</td>
                            <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: m.qty > 0 ? 'var(--success)' : m.qty < 0 ? 'var(--fg)' : 'var(--fg-muted)' }}>
                              {m.qty > 0 ? '+' : ''}{m.qty || '—'}
                            </td>
                            <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: m.unit_cost ? 'var(--fg)' : 'var(--fg-muted)' }}>
                              {m.unit_cost ? brl(m.unit_cost) : '—'}
                            </td>
                            <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{m.reason ?? '—'}</td>
                            <td><I.ChevronRight size={13} style={{ color: 'var(--fg-faint)' }} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <Pagination page={filters.page} pageSize={pageSize} total={total} pending={pending} onPage={(page) => update({ page })} />
            </div>
          </>
        )}
      </Page>
    </StoreShell>
  );
}

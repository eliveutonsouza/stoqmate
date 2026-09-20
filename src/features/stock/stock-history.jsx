"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { Toolbar } from '@/components/ui/toolbar';
import { MOVEMENT_TYPES } from '@/lib/movement-types';
import { CategoryBadge } from '@/components/ui/category-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { brl } from '@/lib/format';

export function StockHistory({ movements }) {
  const navigate = useNavigate();
  const [tab, setTab] = React.useState('all');

  const rows = tab === 'all' ? movements : movements.filter((m) => m.kind === tab);
  const kindsPresent = [...new Set(movements.map((m) => m.kind))];
  const qtyIn = movements.filter((m) => m.qty > 0).reduce((s, m) => s + m.qty, 0);
  const qtyOut = movements.filter((m) => m.qty < 0).reduce((s, m) => s + Math.abs(m.qty), 0);
  const transfers = movements.filter((m) => m.kind === 'transfer').length;

  return (
    <StoreShell route="/stock/history" breadcrumb={['Estoque', 'Histórico']} navigate={navigate}>
      <PageHeader
        title="Movimentações"
        sub={`Tudo que entrou, saiu ou mudou de loja · ${movements.length} registro${movements.length === 1 ? '' : 's'}`}
        actions={(
          <>
            <button className="btn btn-outline btn-sm"><I.Download size={13} /> Exportar</button>
            <button onClick={() => navigate('/stock/entry')} className="btn btn-primary btn-sm"><I.Plus size={13} /> Nova movimentação</button>
          </>
        )}
        tabs={[
          { id: 'all', label: `Todas · ${movements.length}` },
          ...kindsPresent.map((k) => ({ id: k, label: `${MOVEMENT_TYPES[k]?.label ?? k} · ${movements.filter((m) => m.kind === k).length}` })),
        ]}
        activeTab={tab}
        onTab={setTab}
      />

      <Page>
        {movements.length === 0 ? (
          <EmptyState
            icon={<I.Activity size={18} />}
            title="Nenhuma movimentação registrada ainda"
            desc="Entradas, transferências, ajustes e contagens aparecem aqui assim que forem confirmados."
            action={<button onClick={() => navigate('/stock/entry')} className="btn btn-primary btn-sm"><I.Plus size={12} /> Nova entrada</button>}
          />
        ) : (
          <>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
              background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden',
            }}>
              {[
                { l: 'Entradas (unidades)', v: `+${qtyIn}` },
                { l: 'Saídas (unidades)', v: `${qtyOut}` },
                { l: 'Transferências', v: `${transfers}` },
              ].map((s, i) => (
                <div key={i} style={{ padding: '14px 16px', borderRight: i < 2 ? '1px solid var(--line)' : 'none' }}>
                  <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{s.l}</div>
                  <div style={{ fontSize: 18, fontWeight: 600, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', marginTop: 4 }}>{s.v}</div>
                </div>
              ))}
            </div>

            <Toolbar
              placeholder="Buscar por SKU ou produto…"
              filters={[{ label: 'Tipo', value: tab === 'all' ? 'Todos' : MOVEMENT_TYPES[tab]?.label }]}
              right={<span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{rows.length} de {movements.length}</span>}
            />

            <div className="card" style={{ overflow: 'hidden' }}>
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
                  </tr>
                </thead>
                <tbody>
                  {rows.map((m) => {
                    const t = MOVEMENT_TYPES[m.kind] ?? MOVEMENT_TYPES.adjustment;
                    return (
                      <tr key={m.id}>
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Page>
    </StoreShell>
  );
}

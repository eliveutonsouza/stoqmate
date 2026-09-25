"use client";

import * as React from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { FilterChip } from '@/components/ui/filter-chip';
import { I } from '@/components/icons';
import { REPORT_PERIODS } from '@/lib/report-range';

// Cabeçalho dos relatórios: período, loja e exportação.
//
// - `range` ({ period, from, to, label }) + `onRangeChange({ period, from, to })`:
//   presets (7/30/90 dias, este mês, mês passado) ou datas personalizadas.
// - `stores` + `storeId` + `onStoreChange(id | null)`: "Toda a rede" ou uma loja.
//   Sem `onStoreChange`, o filtro de loja não aparece.
// - `onExport`: baixa o CSV do que a tela mostra.
// Quem chama guarda tudo na URL (searchParams) — o componente só desenha.
export function ReportHeader({
  title, sub,
  range, onRangeChange,
  stores = [], storeId = null, onStoreChange,
  onExport, exportDisabled = false,
  pending = false,
}) {
  const [draft, setDraft] = React.useState({ from: range?.from ?? '', to: range?.to ?? '' });
  const [custom, setCustom] = React.useState(range?.period === 'custom');
  const [prevRange, setPrevRange] = React.useState(range);
  if (range !== prevRange) {
    setPrevRange(range);
    setDraft({ from: range?.from ?? '', to: range?.to ?? '' });
    setCustom(range?.period === 'custom');
  }

  const selectPeriod = (period) => {
    if (period === 'custom') { setCustom(true); return; }
    setCustom(false);
    onRangeChange?.({ period });
  };
  const applyCustom = () => {
    if (!draft.from || !draft.to) return;
    onRangeChange?.({ period: 'custom', from: draft.from, to: draft.to });
  };

  const storeName = storeId ? stores.find((s) => s.id === storeId)?.name ?? 'Loja' : 'Toda a rede';
  const periodValue = custom ? 'custom' : range?.period;

  return (
    <PageHeader
      title={title}
      sub={sub}
      actions={(
        <>
          {range && onRangeChange && (
            <FilterChip
              label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><I.Filter size={12} /> Período</span>}
              ariaLabel="Período"
              value={range.label}
              selected={periodValue}
              options={REPORT_PERIODS.map((p) => ({ value: p.id, label: p.label }))}
              onChange={selectPeriod}
              disabled={pending}
            />
          )}
          {range && onRangeChange && custom && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <input
                type="date" className="input" aria-label="Data inicial"
                value={draft.from} max={draft.to || undefined}
                onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))}
                style={{ height: 28, width: 140, fontSize: 12 }}
              />
              <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>até</span>
              <input
                type="date" className="input" aria-label="Data final"
                value={draft.to} min={draft.from || undefined}
                onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))}
                style={{ height: 28, width: 140, fontSize: 12 }}
              />
              <button
                type="button" className="btn btn-outline btn-sm" onClick={applyCustom}
                disabled={pending || !draft.from || !draft.to || (range.period === 'custom' && draft.from === range.from && draft.to === range.to)}
              >
                Aplicar
              </button>
            </span>
          )}
          {onStoreChange && stores.length > 0 && (
            <FilterChip
              label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><I.Store size={12} /> Loja</span>}
              ariaLabel="Loja"
              value={storeName}
              active={!!storeId}
              selected={storeId ?? ''}
              options={[{ value: '', label: 'Toda a rede' }, ...stores.map((s) => ({ value: s.id, label: s.name }))]}
              onChange={(id) => onStoreChange(id || null)}
              disabled={pending}
            />
          )}
          {onExport && (
            <button type="button" onClick={onExport} disabled={exportDisabled} className="btn btn-outline btn-sm">
              <I.Download size={13} /> Exportar CSV
            </button>
          )}
        </>
      )}
    />
  );
}

// === Categories & products ===

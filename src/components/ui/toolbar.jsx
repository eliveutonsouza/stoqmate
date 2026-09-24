"use client";

import { I } from '@/components/icons';
import { FilterChip } from '@/components/ui/filter-chip';

export function Toolbar({ placeholder, filters = [], right }) {
  return (
    <div className="toolbar-row" style={{
      padding: '8px 10px',
      background: 'var(--bg-elev)',
      border: '1px solid var(--line)',
      borderRadius: 8,
    }}>
      <div className="toolbar-search" style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-soft)' }}>
          <I.Search size={13} />
        </span>
        <input className="input" placeholder={placeholder} style={{ paddingLeft: 30 }} />
      </div>
      {filters.map((f, i) => <FilterChip key={i} label={f.label} value={f.value} />)}
      <div style={{ flex: 1 }}></div>
      {right}
    </div>
  );
}

// === Product picker used across movement forms ===

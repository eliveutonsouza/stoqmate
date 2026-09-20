"use client";

import { I } from '@/components/icons';

export function SelectInput({ options, value, onChange, placeholder }) {
  return (
    <div style={{ position: 'relative' }}>
      <select className="input" value={value} onChange={(e) => onChange && onChange(e.target.value)} style={{ appearance: 'none', paddingRight: 28, cursor: 'pointer' }}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => {
          const v = typeof o === 'object' ? o.value : o;
          const l = typeof o === 'object' ? o.label : o;
          return <option key={v} value={v}>{l}</option>;
        })}
      </select>
      <span style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--fg-soft)' }}>
        <I.ChevronDown size={13} />
      </span>
    </div>
  );
}

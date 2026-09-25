"use client";

import * as React from 'react';
import { I } from '@/components/icons';
import { FilterChip } from '@/components/ui/filter-chip';

// Barra de busca + filtros de lista.
//
// Busca controlada: passe `value` e `onChange(texto)`. Com `debounce`
// (ms), o onChange só dispara depois que a pessoa para de digitar — Enter
// dispara na hora. Sem `onChange`, o campo fica como antes (não controlado).
//
// `filters`: cada item vira um FilterChip — `{ label, value, active,
// onClick }` (liga/desliga) ou `{ label, value, active, options, selected,
// onChange }` (escolha de uma lista).
export function Toolbar({ placeholder, filters = [], right, value, onChange, debounce = 0, searchLabel }) {
  const controlled = typeof onChange === 'function';
  const [draft, setDraft] = React.useState(value ?? '');
  const [prevValue, setPrevValue] = React.useState(value);
  const [lastSent, setLastSent] = React.useState(value);
  const timer = React.useRef(null);

  // `value` mudou por fora (voltar/avançar, link, limpar filtros): o campo
  // acompanha. Quando é o eco do que a própria digitação mandou, não
  // sobrescreve — senão engoliria o que foi digitado enquanto a URL trocava.
  if (value !== prevValue) {
    setPrevValue(value);
    if (value !== lastSent) setDraft(value ?? '');
  }

  React.useEffect(() => {
    const t = timer;
    return () => clearTimeout(t.current);
  }, []);

  const send = (text) => {
    clearTimeout(timer.current);
    setLastSent(text);
    onChange(text);
  };

  const handleChange = (e) => {
    const text = e.target.value;
    setDraft(text);
    if (!debounce) { send(text); return; }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => send(text), debounce);
  };

  return (
    <div className="toolbar-row" style={{
      padding: '8px 10px',
      background: 'var(--bg-elev)',
      border: '1px solid var(--line)',
      borderRadius: 8,
    }}>
      <div className="toolbar-search" style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-soft)', display: 'flex' }}>
          <I.Search size={13} />
        </span>
        {controlled ? (
          <>
            <input
              className="input"
              type="search"
              placeholder={placeholder}
              aria-label={searchLabel || placeholder || 'Buscar'}
              value={draft}
              onChange={handleChange}
              onKeyDown={(e) => { if (e.key === 'Enter') send(draft); }}
              style={{ paddingLeft: 30, paddingRight: draft ? 30 : undefined }}
            />
            {draft && (
              <button
                type="button"
                aria-label="Limpar busca"
                onClick={() => { setDraft(''); send(''); }}
                style={{
                  position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                  width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'none', border: 'none', borderRadius: 4, color: 'var(--fg-soft)', cursor: 'pointer',
                }}
              >
                <I.X size={12} />
              </button>
            )}
          </>
        ) : (
          <input className="input" placeholder={placeholder} aria-label={searchLabel || placeholder || 'Buscar'} style={{ paddingLeft: 30 }} />
        )}
      </div>
      {filters.map((f, i) => <FilterChip key={f.label ?? i} {...f} />)}
      <div style={{ flex: 1 }}></div>
      {right}
    </div>
  );
}

// === Product picker used across movement forms ===

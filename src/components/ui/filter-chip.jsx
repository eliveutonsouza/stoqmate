"use client";

import { I } from '@/components/icons';

// Chip de filtro de lista. Dois modos:
// - liga/desliga: `onClick` + `active` (vira aria-pressed);
// - escolha: `options` [{ value, label }] + `selected` + `onChange(valor)`.
//   Usa um <select> nativo transparente por cima do chip — teclado, leitor
//   de tela e o seletor do celular vêm de graça.
// Sem nenhum dos dois, só exibe (compatível com o uso antigo).
export function FilterChip({ label, value, active = false, onClick, options, selected, onChange, disabled = false, ariaLabel }) {
  const a11yLabel = ariaLabel ?? (typeof label === 'string' ? label : undefined);
  const chip = {
    position: 'relative',
    display: 'inline-flex', alignItems: 'center', gap: 6,
    height: 28, padding: '0 9px', maxWidth: '100%',
    background: active ? 'var(--accent-soft)' : 'var(--bg-elev)',
    border: '1px solid ' + (active ? 'var(--accent)' : 'var(--line)'),
    borderRadius: 5, fontSize: 12, color: 'var(--fg-muted)',
    cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.6 : 1,
    whiteSpace: 'nowrap',
  };
  const content = (
    <>
      <span style={{ color: active ? 'var(--accent-text)' : 'var(--fg-muted)' }}>{label}</span>
      {value != null && value !== '' && (
        <span style={{ color: active ? 'var(--accent-text)' : 'var(--fg)', fontWeight: active ? 500 : 400, overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</span>
      )}
    </>
  );

  if (Array.isArray(options)) {
    return (
      <span style={chip}>
        {content}
        <I.ChevronDown size={11} />
        <select
          aria-label={a11yLabel}
          value={selected ?? ''}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.value)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'inherit', fontSize: 16 }}
        >
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </span>
    );
  }

  const toggle = typeof onClick === 'function';
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-pressed={toggle ? active : undefined} style={chip}>
      {content}
      {!toggle && <I.ChevronDown size={11} />}
    </button>
  );
}

// === Categories & attribute schemas ===

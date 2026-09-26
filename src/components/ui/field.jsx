"use client";

import * as React from 'react';

// Liga o <label> ao controle: TextInput/SelectInput/TextareaInput dentro do
// Field usam este id (leitor de tela anuncia o rótulo; clicar no rótulo
// foca o campo). Antes o label ficava solto, sem associação nenhuma.
const FieldIdContext = React.createContext(undefined);

// id={null} tira o controle da associação (Field com vários controles
// repetidos, que se rotulam com aria-label próprio).
export function useFieldId(explicitId) {
  const fromField = React.useContext(FieldIdContext);
  return explicitId === undefined ? fromField : explicitId ?? undefined;
}

export function Field({ label, hint, required, error, children, span }) {
  const id = React.useId();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: span ? `span ${span}` : undefined, minWidth: 0 }}>
      <label htmlFor={id} style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
        {label}
        {required && <span style={{ color: 'var(--accent-text)' }}>*</span>}
      </label>
      <FieldIdContext.Provider value={id}>{children}</FieldIdContext.Provider>
      {error && <span style={{ fontSize: 11, color: 'var(--danger)' }}>{error}</span>}
      {hint && !error && <span style={{ fontSize: 11, color: 'var(--fg-soft)' }}>{hint}</span>}
    </div>
  );
}

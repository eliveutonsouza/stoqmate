"use client";


export function FormPageFooter({ onCancel, onSave, saveLabel, saveDisabled, extra }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 4 }}>
      <button onClick={onCancel} className="btn btn-ghost">Cancelar</button>
      <div style={{ flex: 1 }}></div>
      {extra}
      <button onClick={onSave} disabled={saveDisabled} className="btn btn-primary btn-lg">{saveLabel}</button>
    </div>
  );
}

// === /suppliers/new · /suppliers/edit ===

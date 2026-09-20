"use client";


export function StatusBadge({ status }) {
  const m = {
    active: { label: 'Ativa', cls: 'badge-success' },
    trial: { label: 'Trial', cls: 'badge-info' },
    past_due: { label: 'Inadimplente', cls: 'badge-warning' },
    cancelled: { label: 'Cancelada', cls: 'badge-danger' },
  };
  const s = m[status] || m['active'];
  return <span className={`badge ${s.cls}`}><span className="badge-dot"></span> {s.label}</span>;
}

// === Admin Stores list ===

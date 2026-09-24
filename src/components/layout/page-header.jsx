"use client";


export function PageHeader({ title, sub, actions, tabs, activeTab, onTab }) {
  return (
    <div style={{
      borderBottom: tabs ? 'none' : '1px solid var(--line)',
      padding: '22px var(--page-pad) 18px',
    }}>
      <div className="page-header-row" style={{ alignItems: 'flex-end' }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{
            margin: 0, fontSize: 22, fontWeight: 600,
            letterSpacing: '-0.022em', color: 'var(--fg)',
          }}>{title}</h1>
          {sub && <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--fg-muted)' }}>{sub}</p>}
        </div>
        {actions && <div className="page-header-actions">{actions}</div>}
      </div>
      {tabs && (
        <div className="page-tabs" style={{
          marginTop: 18, marginBottom: -19,
          borderBottom: '1px solid var(--line)',
        }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => onTab && onTab(t.id)} style={{
              background: 'transparent', border: 'none',
              padding: '8px 12px 10px',
              fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap',
              color: activeTab === t.id ? 'var(--fg)' : 'var(--fg-muted)',
              borderBottom: activeTab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -1,
            }}>{t.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

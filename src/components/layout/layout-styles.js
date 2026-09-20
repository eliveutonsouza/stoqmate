
export const layoutStyles = {
  appShell: {
    display: 'grid',
    gridTemplateColumns: 'var(--sidebar-w, 240px) 1fr',
    height: '100vh',
    background: 'var(--bg)',
    color: 'var(--fg)',
  },
  sidebar: {
    borderRight: '1px solid var(--line)',
    background: 'var(--bg-sunken)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    height: 52,
    borderBottom: '1px solid var(--line)',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '0 18px',
    background: 'var(--bg)',
    flexShrink: 0,
  },
  main: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minWidth: 0,
  },
  content: {
    flex: 1,
    overflow: 'auto',
    background: 'var(--bg)',
  },
};

// === Public layout (Landing) ===

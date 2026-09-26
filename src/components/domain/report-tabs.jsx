"use client";

const REPORT_TABS = [
  { r: '/reports/sales', l: 'Vendas' },
  { r: '/reports/categories', l: 'Categorias e produtos' },
  { r: '/reports/attributes', l: 'Atributos' },
  { r: '/reports/profit', l: 'Lucratividade' },
  { r: '/reports/abc', l: 'Curva ABC' },
];

// Filtros que valem pra todos os relatórios: trocar de aba não pode zerar
// o período nem a loja escolhidos.
const SHARED_PARAMS = ['period', 'from', 'to', 'store'];

function withSharedFilters(route) {
  const current = new URLSearchParams(window.location.search);
  const next = new URLSearchParams();
  for (const k of SHARED_PARAMS) {
    const v = current.get(k);
    if (v) next.set(k, v);
  }
  const qs = next.toString();
  return qs ? `${route}?${qs}` : route;
}

export function ReportTabs({ route, navigate }) {
  return (
    <div className="no-bars" style={{ display: 'flex', gap: 2, padding: 3, background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 8, alignSelf: 'flex-start', maxWidth: '100%', overflowX: 'auto' }}>
      {REPORT_TABS.map(t => {
        const active = route === t.r;
        return (
          <button key={t.r} onClick={() => navigate(withSharedFilters(t.r))} style={{
            background: active ? 'var(--bg-elev)' : 'transparent',
            border: '1px solid ' + (active ? 'var(--line)' : 'transparent'),
            borderRadius: 5, padding: '5px 12px', fontSize: 12.5, fontWeight: 500,
            color: active ? 'var(--fg)' : 'var(--fg-muted)',
            boxShadow: active ? 'var(--shadow-xs)' : 'none', whiteSpace: 'nowrap',
          }}>{t.l}</button>
        );
      })}
    </div>
  );
}

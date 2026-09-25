"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { ReportHeader } from '@/components/domain/report-header';
import { Page } from '@/components/ui/page-container';
import { ReportTabs } from '@/components/domain/report-tabs';
import { I } from '@/components/icons';
import { colorHex, isColorValue } from '@/lib/attr-colors';
import { AttrChip } from '@/components/ui/attr-chip';
import { brl } from '@/lib/format';
import { downloadCsv, toCsv } from '@/lib/csv';
import { useReportHeader } from '@/features/reports/use-report-header';
import { useQueryUpdate } from '@/hooks/use-query-update';

export function ReportAttributes({ categories, categoryId, data, filters, stores }) {
  const navigate = useNavigate();
  const { headerProps, scopeLabel, fileSuffix } = useReportHeader(filters, stores);
  const { update } = useQueryUpdate();
  const cat = categories.find((c) => c.id === categoryId);

  const exportRows = (cat?.category_attributes ?? []).flatMap((attr) => {
    const rows = data[attr.key] || [];
    const totalU = rows.reduce((s, r) => s + r.units, 0);
    return rows.map((r, i) => [attr.label, i + 1, r.value, r.units, r.revenue, totalU > 0 ? (r.units / totalU) * 100 : 0]);
  });
  const exportCsv = () => downloadCsv(`atributos-${cat?.code ?? 'categoria'}_${fileSuffix}.csv`, toCsv(
    ['Atributo', '#', 'Valor', 'Unidades', 'Receita', 'Share (%)'],
    exportRows,
  ));

  if (!cat) {
    return (
      <StoreShell route="/reports/attributes" breadcrumb={['Relatórios', 'Atributos']} navigate={navigate}>
        <ReportHeader title="Atributos mais vendidos" {...headerProps} />
        <Page><ReportTabs route="/reports/attributes" navigate={navigate} />
          <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--fg-muted)' }}>Nenhuma categoria cadastrada ainda.</div>
        </Page>
      </StoreShell>
    );
  }

  return (
    <StoreShell route="/reports/attributes" breadcrumb={['Relatórios', 'Atributos']} navigate={navigate}>
      <ReportHeader
        title="Atributos mais vendidos"
        sub={`${scopeLabel} · quais variações giram, no esquema de cada categoria`}
        {...headerProps}
        onExport={exportCsv}
        exportDisabled={exportRows.length === 0}
      />
      <Page>
        <ReportTabs route="/reports/attributes" navigate={navigate} />

        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
          padding: '10px 12px', background: 'var(--bg-elev)',
          border: '1px solid var(--line)', borderRadius: 8,
        }}>
          <span style={{ fontSize: 12, color: 'var(--fg-muted)', marginRight: 2 }}>Categoria</span>
          {categories.map((cc) => {
            const active = categoryId === cc.id;
            const CIco = I[cc.icon] || I.Box;
            return (
              <button key={cc.id} type="button" aria-pressed={active} onClick={() => update({ category: cc.id })} style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                height: 28, padding: '0 11px',
                border: '1px solid ' + (active ? 'var(--accent)' : 'var(--line)'),
                background: active ? 'var(--accent-soft)' : 'var(--bg-elev)',
                color: active ? 'var(--accent-text)' : 'var(--fg-muted)',
                borderRadius: 5, fontSize: 12, fontWeight: active ? 500 : 400,
              }}>
                <span style={{ color: active ? 'var(--accent-text)' : cc.color, display: 'flex' }}><CIco size={12} /></span>
                {cc.name}
              </button>
            );
          })}
        </div>

        {cat.category_attributes.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--fg-muted)' }}>{cat.name} não tem atributos configurados.</div>
        ) : (
          <div className={cat.category_attributes.length === 1 ? undefined : `g${Math.min(cat.category_attributes.length, 5)}`}>
            {cat.category_attributes.map((attr) => {
              const rows = data[attr.key] || [];
              const maxU = Math.max(1, ...rows.map((r) => r.units));
              const totalU = rows.reduce((s, r) => s + r.units, 0);
              const leader = rows.length ? rows.reduce((a, b) => (a.units > b.units ? a : b)) : null;
              return (
                <div key={attr.key} className="card table-scroll">
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>{attr.label}</h3>
                      <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>
                        {leader ? <>Líder: <strong style={{ color: 'var(--fg)', fontWeight: 500 }}>{leader.value}</strong> com {((leader.units / totalU) * 100).toFixed(0)}% do volume.</> : 'Sem venda no período.'}
                      </p>
                    </div>
                    <span className="badge">{attr.type === 'color' ? 'Cor' : attr.type === 'size' ? 'Tamanho' : 'Especificação'}</span>
                  </div>

                  {attr.type === 'color' && rows.length > 0 && (
                    <div style={{ display: 'flex', height: 8, margin: '14px 18px 0', borderRadius: 4, overflow: 'hidden' }}>
                      {rows.map((r, i) => (
                        <div key={r.value} title={r.value} style={{
                          width: `${(r.units / totalU) * 100}%`,
                          background: colorHex(r.value),
                          borderRight: i < rows.length - 1 ? '1px solid var(--bg-elev)' : 'none',
                        }}></div>
                      ))}
                    </div>
                  )}

                  {rows.length === 0 ? (
                    <div style={{ padding: '18px', fontSize: 12.5, color: 'var(--fg-muted)' }}>Sem venda no período.</div>
                  ) : (
                    <table className="table">
                      <thead>
                        <tr><th style={{ width: 26 }}>#</th><th>Valor</th><th style={{ width: '32%' }}>Volume</th><th className="num">Receita</th><th className="num">Share</th></tr>
                      </thead>
                      <tbody>
                        {rows.map((r, i) => (
                          <tr key={r.value}>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)' }}>{i + 1}</td>
                            <td><AttrChip value={r.value} /></td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                                <div style={{ flex: 1, height: 4, background: 'var(--bg-sunken)', borderRadius: 2 }}>
                                  <div style={{
                                    width: `${(r.units / maxU) * 100}%`, height: '100%',
                                    background: isColorValue(r.value) ? colorHex(r.value) : 'var(--accent)',
                                    borderRadius: 2,
                                    border: r.value === 'Branco' ? '1px solid var(--line-strong)' : 'none',
                                    boxSizing: 'border-box',
                                  }}></div>
                                </div>
                                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)', minWidth: 28, textAlign: 'right' }}>{r.units}</span>
                              </div>
                            </td>
                            <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{brl(r.revenue)}</td>
                            <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{((r.units / totalU) * 100).toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ padding: '12px 14px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 8, display: 'flex', gap: 11, alignItems: 'center' }}>
          <span style={{ color: 'var(--fg-muted)', flexShrink: 0 }}><I.Sliders size={15} /></span>
          <div style={{ fontSize: 12, color: 'var(--fg-muted)', flex: 1, lineHeight: 1.5 }}>
            Este relatório se adapta ao esquema: adicione um atributo em <strong style={{ color: 'var(--fg)', fontWeight: 500 }}>{cat.name}</strong> e ele ganha uma coluna aqui automaticamente.
          </div>
          <button onClick={() => navigate('/categories')} className="btn btn-outline btn-sm">Editar esquema</button>
        </div>
      </Page>
    </StoreShell>
  );
}

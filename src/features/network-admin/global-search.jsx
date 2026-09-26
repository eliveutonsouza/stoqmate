"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { unwrap, useAITask } from '@/features/ai/use-ai-task';
import { askInventoryAction } from '@/features/ai/actions';
import { globalSearchAction } from '@/features/network-admin/search-actions';
import { variantLabel } from '@/lib/attr-colors';
import { brl } from '@/lib/format';
import { StoreShell } from '@/components/ui/store-shell';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { AIThinking } from '@/features/ai/ai-thinking';
import { AIError } from '@/features/ai/ai-error';
import { AIChip } from '@/features/ai/ai-chip';
import { ConfidenceBar } from '@/features/ai/confidence-bar';
import { AttrChip } from '@/components/ui/attr-chip';
import { EmptyState } from '@/components/ui/empty-state';
import { ProductThumb } from '@/components/ui/product-thumb';

export function GlobalSearch() {
  const navigate = useNavigate();
  const [q, setQ] = React.useState('');
  const [asked, setAsked] = React.useState(null);
  const ai = useAITask();
  const [results, setResults] = React.useState(null);
  const [searchedQuery, setSearchedQuery] = React.useState('');
  const term = q.trim();
  const searching = term.length >= 2 && searchedQuery !== term;

  React.useEffect(() => {
    if (term.length < 2) return;
    let cancelled = false;
    const handle = setTimeout(async () => {
      const data = await globalSearchAction(term);
      if (!cancelled) { setResults(data); setSearchedQuery(term); }
    }, 250);
    return () => { cancelled = true; clearTimeout(handle); };
  }, [term]);

  const ask = (preset) => {
    const question = typeof preset === 'string' ? preset : q;
    setAsked(question);
    ai.run(async () => {
      const { spec, rows, metric, metricKind } = unwrap(await askInventoryAction(question));
      const metricLabel = metricKind === 'sumSale' ? brl(metric)
        : metricKind === 'sumStock' ? `${metric} unidades`
        : `${metric} ${metric === 1 ? 'produto' : 'produtos'}`;
      return { spec, rows, metric: metricLabel };
    });
  };

  const groups = results && term.length >= 2 ? [
    {
      label: 'Produtos', icon: 'Box',
      rows: results.products.map((p) => ({
        title: p.name, sub: `${p.brand ?? ''} · ${variantLabel(p.attrs || {})}`.replace(/^ · /, ''),
        mono: p.sku, category: p.category, route: `/products/detail?id=${p.id}`,
      })),
    },
    {
      label: 'Movimentações', icon: 'Activity',
      rows: results.movements.map((m) => ({
        title: `${m.kind} · ${m.product?.name ?? ''}`,
        sub: `${new Date(m.created_at).toLocaleString('pt-BR')} · ${m.store?.name ?? ''}`,
        mono: m.qty > 0 ? `+${m.qty}` : `${m.qty}`, route: `/stock/movement?id=${m.id}`,
      })),
    },
    {
      label: 'Fornecedores', icon: 'Truck',
      rows: results.suppliers.map((s) => ({ title: s.name, sub: s.cnpj ?? '—', mono: '', route: `/suppliers/detail?id=${s.id}` })),
    },
    {
      label: 'Promoções', icon: 'Tag',
      rows: results.promotions.map((p) => ({ title: p.name, sub: p.active ? 'Ativa' : 'Inativa', mono: brl(p.promo_price), route: '/promotions' })),
    },
    {
      label: 'Locais de estoque', icon: 'Grid',
      rows: results.locations.map((l) => ({ title: l.code, sub: l.description ?? '—', mono: '', route: '/shelves' })),
    },
  ].filter((g) => g.rows.length > 0) : [];

  const totalResults = groups.reduce((s, g) => s + g.rows.length, 0);

  return (
    <StoreShell route="/search" breadcrumb={['Busca']} navigate={navigate}>
      <div className="page-pad" style={{ paddingTop: 22, paddingBottom: 0 }}>
        <div style={{ position: 'relative', maxWidth: 620 }}>
          <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-muted)' }}>
            <I.Search size={16} />
          </span>
          <input className="input" value={q} onChange={(e) => setQ(e.target.value)} autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter' && q.trim().length >= 2 && ai.state !== 'running') ask(); }}
            placeholder="Buscar ou perguntar: quais fones estão abaixo do mínimo?"
            style={{ paddingLeft: 40, paddingRight: 128, height: 44, fontSize: 15 }} />
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 6, alignItems: 'center' }}>
            <button onClick={() => ask()} disabled={ai.state === 'running' || q.trim().length < 2} className="btn btn-primary btn-sm" style={{ opacity: ai.state === 'running' ? 0.6 : 1 }}>
              <I.Sparkle size={12} /> {ai.state === 'running' ? 'Pensando…' : 'Perguntar'}
            </button>
          </span>
        </div>
        {q.trim().length >= 2 && !(asked === q && totalResults === 0) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{searching ? 'Buscando…' : `${totalResults} ${totalResults === 1 ? "resultado" : "resultados"} para "${q}"`}</span>
            {!searching && results?.error && <span role="alert" style={{ fontSize: 12, color: 'var(--danger)' }}>{results.error}</span>}
            <div style={{ flex: 1 }}></div>
            <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>Busca em toda a rede</span>
          </div>
        )}
      </div>

      <Page gap={16}>
        {ai.state === 'running' && <AIThinking label={`Respondendo "${asked}"`} detail="Consultando catálogo, saldos e receita por categoria da rede." />}
        {ai.state === 'error' && <AIError message={ai.error} onRetry={() => ask(asked)} />}
        {ai.state === 'done' && ai.data && (
          <div className="card table-scroll" style={{ borderColor: 'var(--accent)' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)', background: 'var(--accent-soft)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
                <AIChip label="Resposta da IA" size="md" />
                <div style={{ flex: 1 }}></div>
                <ConfidenceBar value={(ai.data.spec && ai.data.spec.confidence) || 0} />
                <button onClick={() => ai.reset()} className="btn btn-ghost btn-icon btn-sm"><I.X size={13} /></button>
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--fg)', lineHeight: 1.5, letterSpacing: '-0.008em' }}>
                {(ai.data.spec && ai.data.spec.title) || 'Resultado'} · <strong style={{ fontFamily: 'var(--font-mono)' }}>{ai.data.metric}</strong>
              </div>
            </div>

            <div style={{ padding: '10px 18px', background: 'var(--bg-sunken)', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>Filtro aplicado</span>
              {((ai.data.spec && ai.data.spec.filters) || []).length === 0
                ? <span className="badge">todos os produtos</span>
                : ai.data.spec.filters.map((f, i) => (
                  <span key={i} style={{
                    fontFamily: 'var(--font-mono)', fontSize: 11, padding: '2px 7px', borderRadius: 4,
                    background: 'var(--bg-elev)', border: '1px solid var(--line)', color: 'var(--fg-muted)',
                  }}>{f.field} {f.op}{f.value != null ? ' ' + f.value : ''}</span>
                ))}
              <div style={{ flex: 1 }}></div>
              <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>números calculados pelo sistema, não pelo modelo</span>
            </div>

            {ai.data.rows.length > 0 ? (
              <table className="table">
                <thead>
                  <tr><th>SKU</th><th>Produto</th><th>Variação</th><th className="num">Saldo</th><th className="num">Preço</th><th>Local</th><th style={{ width: 70 }}></th></tr>
                </thead>
                <tbody>
                  {ai.data.rows.slice(0, 12).map(r => (
                    <tr key={r.sku}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)' }}>{r.sku}</td>
                      <td style={{ fontSize: 13 }}>{r.name}</td>
                      <td><AttrChip value={r.variant} /></td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500, color: r.stock < r.minStock ? 'var(--danger)' : 'var(--fg)' }}>{r.stock}</td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{brl(r.sale)}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{r.loc}</td>
                      <td><button onClick={() => navigate(`/products/detail?id=${r.id}`)} className="btn btn-ghost btn-sm">Abrir</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState icon={<I.Search size={18} />} title="Nenhum produto atende ao filtro"
                desc="A pergunta foi entendida, mas nenhum item do catálogo se encaixa. Tente outro critério." />
            )}

            {ai.data.spec && ai.data.spec.note && (
              <div style={{ padding: '12px 18px', background: 'var(--bg-sunken)', borderTop: '1px solid var(--line)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--accent-text)', flexShrink: 0, marginTop: 1 }}><I.Sparkle size={13} /></span>
                <span style={{ fontSize: 12.5, color: 'var(--fg-muted)', lineHeight: 1.5 }}>{ai.data.spec.note}</span>
              </div>
            )}
            <div style={{ padding: '10px 18px', borderTop: '1px solid var(--line)' }}>
              <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>A IA traduziu a pergunta em filtro · consome 1 crédito de IA</span>
            </div>
          </div>
        )}

        {q.trim().length >= 2 && !searching && groups.length === 0 && asked !== q && (
          <EmptyState icon={<I.Search size={18} />} title="Nenhum resultado" desc={`Nada encontrado para "${q}" em produtos, movimentações, fornecedores, promoções ou locais.`} />
        )}

        {groups.map(g => {
          const Ico = I[g.icon] || I.Box;
          return (
            <div key={g.label} className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '11px 18px', display: 'flex', alignItems: 'center', gap: 9, borderBottom: '1px solid var(--line)', background: 'var(--bg-sunken)' }}>
                <span style={{ color: 'var(--fg-muted)', display: 'flex' }}><Ico size={13} /></span>
                <span style={{ fontSize: 12, fontWeight: 500 }}>{g.label}</span>
                <span style={{ fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{g.rows.length}</span>
              </div>
              {g.rows.map((r, i) => (
                <button key={i} onClick={() => navigate(r.route)} style={{
                  display: 'flex', gap: 12, alignItems: 'center', width: '100%', textAlign: 'left',
                  padding: '11px 18px', background: 'transparent', border: 'none',
                  borderBottom: i < g.rows.length - 1 ? '1px solid var(--line-soft)' : 'none',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  {r.category && <ProductThumb category={r.category} attrs={{}} size={28} />}
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--fg)' }}>{r.title}</span>
                    <span style={{ display: 'block', fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>{r.sub}</span>
                  </span>
                  {r.mono && <span style={{ fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{r.mono}</span>}
                  <span style={{ color: 'var(--fg-muted)', display: 'flex', flexShrink: 0 }}><I.ChevronRight size={13} /></span>
                </button>
              ))}
            </div>
          );
        })}

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 8 }}>
          <span style={{ color: 'var(--fg-muted)', flexShrink: 0 }}><I.Sparkle size={15} /></span>
          <div style={{ fontSize: 12, color: 'var(--fg-muted)', flex: 1, lineHeight: 1.5 }}>
            Tente perguntar: {['quais produtos estão abaixo do mínimo?', 'qual categoria vende mais?', 'onde está meu dinheiro parado?'].map((ex, i) => (
              <React.Fragment key={ex}>
                {i > 0 && ' · '}
                <button onClick={() => { setQ(ex); ask(ex); }} style={{
                  background: 'none', border: 'none', padding: 0, font: 'inherit',
                  color: 'var(--accent-text)', fontWeight: 500, cursor: 'pointer',
                }}>&ldquo;{ex}&rdquo;</button>
              </React.Fragment>
            ))}
          </div>
          <AIChip label="IA" />
        </div>
      </Page>
    </StoreShell>
  );
}

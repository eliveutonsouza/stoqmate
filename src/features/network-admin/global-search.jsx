"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { useAITask } from '@/features/ai/use-ai-task';
import { askInventoryAction } from '@/features/ai/actions';
import { variantLabel } from '@/lib/attr-colors';
import { CATALOG } from '@/lib/catalog';
import { brl } from '@/lib/format';
import { StoreShell } from '@/components/ui/store-shell';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { SemanticResults } from '@/features/ai-flows/semantic-results';
import { AIThinking } from '@/features/ai/ai-thinking';
import { AIError } from '@/features/ai/ai-error';
import { AIChip } from '@/features/ai/ai-chip';
import { ConfidenceBar } from '@/features/ai/confidence-bar';
import { AttrChip } from '@/components/ui/attr-chip';
import { EmptyState } from '@/components/ui/empty-state';
import { ProductThumb } from '@/components/ui/product-thumb';

export function GlobalSearch() {
  const navigate = useNavigate();
  const [q, setQ] = React.useState('fone');
  const [asked, setAsked] = React.useState(null);
  const ai = useAITask();

  const ask = () => {
    const question = q;
    setAsked(question);
    // A IA só traduz a pergunta numa especificação de filtro; quem soma,
    // conta e ordena é o servidor, sobre dado real — pedir pro modelo contar
    // linhas é como se ganha número errado com confiança.
    ai.run(async () => {
      const { spec, rows, metric, metricKind } = await askInventoryAction(question);
      const metricLabel = metricKind === 'sumSale' ? brl(metric)
        : metricKind === 'sumStock' ? `${metric} unidades`
        : `${metric} ${metric === 1 ? 'produto' : 'produtos'}`;
      return { spec, rows, metric: metricLabel };
    });
  };

  const groups = [
    {
      label: 'Produtos', count: 8, icon: 'Box',
      rows: CATALOG.filter(p => p.name.toLowerCase().includes('fone') || p.cat === 'eletronicos').slice(0, 4).map(p => ({
        title: p.name, sub: `${p.brand} · ${variantLabel(p.attrs)} · ${p.stock} em estoque`,
        mono: p.sku, cat: p.cat, route: '/products/detail',
      })),
    },
    {
      label: 'Movimentações', count: 12, icon: 'Activity',
      rows: [
        { title: 'Venda · Fone Bluetooth ANC / Preto', sub: '18/09 14:38 · Lucas · R$ 299,00', mono: '#4286', route: '/stock/history' },
        { title: 'Entrada · Fone Bluetooth ANC / Preto', sub: '18/09 09:05 · Ana · R$ 7.584,00', mono: 'NF 8420', route: '/stock/history' },
        { title: 'Ajuste · Fone Bluetooth ANC / Preto', sub: '17/09 18:14 · Ana · −2 un', mono: 'INV-05', route: '/stock/history' },
      ],
    },
    {
      label: 'Fornecedores', count: 1, icon: 'Truck',
      rows: [{ title: 'TechDistrib', sub: 'Eletrônicos · 186 SKUs · R$ 186.400 em 12 meses', mono: '12.345.678/0001-90', route: '/suppliers/detail' }],
    },
    {
      label: 'Promoções', count: 1, icon: 'Tag',
      rows: [{ title: 'Semana do Áudio', sub: 'Ativa até 22/09 · Eletrônicos · Foneclear · −16,7%', mono: '8 SKUs', route: '/promotions' }],
    },
    {
      label: 'Locais de estoque', count: 2, icon: 'Grid',
      rows: [
        { title: 'A-04', sub: 'Corredor A · altura dos olhos · eletrônicos · 428 itens', mono: '62 SKUs', route: '/shelves' },
        { title: 'A-05', sub: 'Corredor A · base · acessórios · 314 itens', mono: '48 SKUs', route: '/shelves' },
      ],
    },
  ];

  return (
    <StoreShell route="/search" breadcrumb={['Busca']} navigate={navigate}>
      <div style={{ padding: '22px 28px 0' }}>
        <div style={{ position: 'relative', maxWidth: 620 }}>
          <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-muted)' }}>
            <I.Search size={16} />
          </span>
          <input className="input" value={q} onChange={(e) => setQ(e.target.value)} autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') ask(); }}
            placeholder="Buscar ou perguntar: quais fones estão abaixo do mínimo?"
            style={{ paddingLeft: 40, paddingRight: 128, height: 44, fontSize: 15 }} />
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 6, alignItems: 'center' }}>
            <button onClick={ask} disabled={ai.state === 'running'} className="btn btn-primary btn-sm" style={{ opacity: ai.state === 'running' ? 0.6 : 1 }}>
              <I.Sparkle size={12} /> {ai.state === 'running' ? 'Pensando…' : 'Perguntar'}
            </button>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>24 resultados para “{q}”</span>
          <span className="divider-v" style={{ height: 14 }}></span>
          {['Tudo', 'Produtos', 'Movimentações', 'Fornecedores', 'Promoções', 'Locais'].map((f, i) => (
            <button key={f} style={{
              height: 26, padding: '0 10px', borderRadius: 5,
              border: '1px solid ' + (i === 0 ? 'var(--accent)' : 'var(--line)'),
              background: i === 0 ? 'var(--accent-soft)' : 'var(--bg-elev)',
              color: i === 0 ? 'var(--accent-text)' : 'var(--fg-muted)',
              fontSize: 12, fontWeight: i === 0 ? 500 : 400,
            }}>{f}</button>
          ))}
          <div style={{ flex: 1 }}></div>
          <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>Busca em toda a rede</span>
        </div>
      </div>

      <Page gap={16}>
        <SemanticResults q={q} navigate={navigate} />
        {ai.state === 'running' && <AIThinking label={`Respondendo “${asked}”`} detail="Consultando catálogo, saldos e receita por categoria da rede." />}
        {ai.state === 'error' && <AIError message={ai.error} onRetry={ask} />}
        {ai.state === 'done' && ai.data && (
          <div className="card" style={{ overflow: 'hidden', borderColor: 'var(--accent)' }}>
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
                      <td><button onClick={() => navigate('/products/detail')} className="btn btn-ghost btn-sm">Abrir</button></td>
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
            <div style={{ padding: '10px 18px', borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 11, color: 'var(--fg-muted)', flex: 1 }}>
                A IA traduziu a pergunta em filtro · consome 1 crédito de IA
              </span>
              <button className="btn btn-ghost btn-sm">Útil</button>
              <button className="btn btn-ghost btn-sm">Entendeu errado</button>
            </div>
          </div>
        )}
        {groups.map(g => {
          const Ico = I[g.icon] || I.Box;
          return (
            <div key={g.label} className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '11px 18px', display: 'flex', alignItems: 'center', gap: 9, borderBottom: '1px solid var(--line)', background: 'var(--bg-sunken)' }}>
                <span style={{ color: 'var(--fg-muted)', display: 'flex' }}><Ico size={13} /></span>
                <span style={{ fontSize: 12, fontWeight: 500 }}>{g.label}</span>
                <span style={{ fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{g.count}</span>
                <div style={{ flex: 1 }}></div>
                <button className="btn btn-ghost btn-sm">Ver todos <I.ChevronRight size={11} /></button>
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
                  {r.cat && <ProductThumb cat={r.cat} attrs={{}} size={28} />}
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--fg)' }}>{r.title}</span>
                    <span style={{ display: 'block', fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>{r.sub}</span>
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{r.mono}</span>
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
                <button onClick={() => { setQ(ex); }} style={{
                  background: 'none', border: 'none', padding: 0, font: 'inherit',
                  color: 'var(--accent-text)', fontWeight: 500, cursor: 'pointer',
                }}>“{ex}”</button>
              </React.Fragment>
            ))}
          </div>
          <AIChip label="IA" />
        </div>
      </Page>
    </StoreShell>
  );
}

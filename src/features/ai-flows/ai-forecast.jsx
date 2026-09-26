"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { unwrap, useAITask } from '@/features/ai/use-ai-task';
import { forecastReplenishmentAction } from '@/features/ai/actions';
import { variantLabel } from '@/lib/attr-colors';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { EmptyState } from '@/components/ui/empty-state';
import { AIThinking } from '@/features/ai/ai-thinking';
import { AIError } from '@/features/ai/ai-error';
import { ProductThumb } from '@/components/ui/product-thumb';
import { AttrChip } from '@/components/ui/attr-chip';
import { CategoryBadge } from '@/components/ui/category-badge';
import { ConfidenceBar } from '@/features/ai/confidence-bar';
import { AIWhy } from '@/features/ai/ai-why';
import { ReviewActions } from '@/features/ai/review-actions';

export function AIForecast({ base }) {
  const navigate = useNavigate();
  const [result, setResult] = React.useState(null);
  const [decided, setDecided] = React.useState({});
  const [applyError, setApplyError] = React.useState('');
  const task = useAITask();

  const run = () => task.run(async () => {
    const data = unwrap(await forecastReplenishmentAction(base.map(p => ({
      sku: p.sku, name: p.name, attrs: p.attrs, category: p.category?.name ?? '',
      stock: p.stock, sold_30d: p.sold_30d, lead_time_days: p.lead_time_days, suggest_qty: p.suggest_qty,
    }))));
    setResult(data.items || []);
    return data;
  });

  const decide = (sku, v) => setDecided(d => ({ ...d, [sku]: v }));

  const applyAccepted = () => {
    const accepted = base
      .map((p) => ({ p, r: result.find((x) => x.sku === p.sku) }))
      .filter(({ p, r }) => r && decided[p.sku] === 'accept');
    if (accepted.length === 0) return;
    // Pedido é por fornecedor: item sem fornecedor não tem pra onde ir.
    const withSupplier = accepted.filter(({ p }) => p.supplier_id);
    if (withSupplier.length === 0) {
      setApplyError('Os itens aceitos não têm fornecedor — defina o fornecedor no cadastro do produto pra gerar o pedido.');
      return;
    }
    setApplyError('');
    const supplierId = withSupplier[0].p.supplier_id;
    const sameSupplier = accepted.filter(({ p }) => p.supplier_id === supplierId);
    const prefill = sameSupplier.map(({ p, r }) => `${p.product_id}:${Math.round(r.suggested)}`).join(',');
    navigate(`/purchase-orders/new?supplier=${supplierId}&prefill=${encodeURIComponent(prefill)}`);
  };

  if (base.length === 0) {
    return (
      <StoreShell route="/ai/forecast" breadcrumb={['IA', 'Previsão de demanda']} navigate={navigate}>
        <PageHeader title="Previsão de demanda" sub="Nenhum produto precisa de reposição no momento." />
        <Page>
          <div className="card" style={{ overflow: 'hidden' }}>
            <EmptyState icon={<I.Chart size={18} />} title="Nada para repor agora"
              desc="Todos os produtos ativos estão com cobertura de estoque suficiente pela velocidade de venda dos últimos 30 dias." />
          </div>
        </Page>
      </StoreShell>
    );
  }

  return (
    <StoreShell route="/ai/forecast" breadcrumb={['IA', 'Previsão de demanda']} navigate={navigate}>
      <PageHeader
        title="Previsão de demanda"
        sub="A reposição padrão usa velocidade de venda de 30 dias. Aqui a IA acrescenta sazonalidade, tendência e calendário."
        actions={(
          <>
            <button onClick={() => navigate('/purchase-orders')} className="btn btn-outline btn-sm">Reposição padrão</button>
            <button onClick={run} disabled={task.state === 'running'} className="btn btn-primary btn-sm" style={{ opacity: task.state === 'running' ? 0.6 : 1 }}>
              <I.Sparkle size={13} /> {task.state === 'running' ? 'Calculando…' : 'Recalcular com IA'}
            </button>
          </>
        )}
      />
      <Page>
        {task.state === 'idle' && (
          <div className="card" style={{ overflow: 'hidden' }}>
            <EmptyState
              icon={<I.Chart size={18} />}
              title="Nenhuma previsão nesta sessão"
              desc="A IA vai comparar a sugestão padrão com uma projeção que considera sazonalidade, tendência e calendário comercial. Nada é comprado sem sua aprovação."
              action={<button onClick={run} className="btn btn-primary"><I.Sparkle size={13} /> Calcular previsão</button>}
            />
          </div>
        )}
        {task.state === 'running' && <AIThinking label="Projetando demanda dos próximos 30 dias" detail="Cruzando histórico, prazo de fornecedor e calendário comercial brasileiro." />}
        {task.state === 'error' && <AIError message={task.error} onRetry={run} />}

        {result && (
          <>
            <div className="g4 kpi-strip">
              {[
                { l: 'SKUs projetados', v: `${result.length}` },
                { l: 'Sugestão padrão', v: `${base.reduce((s, p) => s + p.suggest_qty, 0)} un`, s: 'velocidade de 30 dias' },
                { l: 'Sugestão da IA', v: `${result.reduce((s, r) => s + (r.suggested || 0), 0)} un`, s: 'com sazonalidade', tone: 'accent' },
                { l: 'Confiança média', v: `${Math.round(result.reduce((s, r) => s + (r.confidence || 0), 0) / result.length)}%` },
              ].map((m, i) => (
                <div key={i} style={{ padding: '16px 18px' }}>
                  <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{m.l}</div>
                  <div style={{ fontSize: 21, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums', marginTop: 4, color: m.tone === 'accent' ? 'var(--accent-text)' : 'var(--fg)' }}>{m.v}</div>
                  {m.s && <div style={{ fontSize: 10.5, color: 'var(--fg-muted)', marginTop: 2 }}>{m.s}</div>}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {base.map(p => {
                const r = result.find(x => x.sku === p.sku);
                if (!r) return null;
                const state = decided[p.sku];
                const up = (r.deltaPct || 0) >= 0;
                return (
                  <div key={p.sku} className="card" style={{ overflow: 'hidden', opacity: state === 'reject' ? 0.6 : 1 }}>
                    <div style={{ padding: 16, display: 'flex', gap: 13, alignItems: 'flex-start' }}>
                      <ProductThumb category={p.category} attrs={p.attrs} size={34} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: '-0.01em' }}>{p.name}</span>
                          <AttrChip value={variantLabel(p.attrs)} />
                          {p.category && <CategoryBadge category={p.category} />}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 10, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
                            Saldo <strong style={{ color: p.stock < p.min_stock ? 'var(--danger)' : 'var(--fg)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{p.stock}</strong>
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
                            Padrão <strong style={{ color: 'var(--fg-muted)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{p.suggest_qty}</strong>
                          </span>
                          <span style={{ color: 'var(--fg-muted)', display: 'flex' }}><I.ArrowRight size={13} /></span>
                          <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
                            IA <strong style={{ fontSize: 15, color: 'var(--accent-text)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{r.suggested}</strong>
                          </span>
                          <span style={{
                            padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)',
                            background: up ? 'var(--success-soft)' : 'var(--warning-soft)',
                            color: up ? 'var(--success)' : 'var(--warning)',
                          }}>{up ? '+' : ''}{r.deltaPct}%</span>
                          <ConfidenceBar value={r.confidence || 0} />
                        </div>
                        {r.drivers && r.drivers.length > 0 && (
                          <div style={{ marginTop: 12 }}><AIWhy reasons={r.drivers} /></div>
                        )}
                        {r.risk && (
                          <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 9, lineHeight: 1.5 }}>
                            <strong style={{ color: 'var(--fg)', fontWeight: 500 }}>Risco:</strong> {r.risk}
                          </div>
                        )}
                      </div>
                      <div style={{ flexShrink: 0 }}>
                        <ReviewActions accepted={state === 'accept'} rejected={state === 'reject'}
                          onAccept={() => decide(p.sku, 'accept')} onReject={() => decide(p.sku, 'reject')} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 8 }}>
              <span style={{ color: 'var(--fg-muted)', flexShrink: 0 }}><I.Truck size={15} /></span>
              <span style={{ fontSize: 12.5, color: 'var(--fg-muted)', flex: 1, lineHeight: 1.5 }}>
                As quantidades aceitas substituem a sugestão na tela de reposição e entram no pedido de compra.
              </span>
              {applyError && <span role="alert" style={{ fontSize: 12, color: 'var(--danger)' }}>{applyError}</span>}
              <button onClick={applyAccepted} disabled={Object.values(decided).filter(v => v === 'accept').length === 0} className="btn btn-primary btn-sm">
                Aplicar {Object.values(decided).filter(v => v === 'accept').length} e abrir reposição
              </button>
            </div>
          </>
        )}
      </Page>
    </StoreShell>
  );
}

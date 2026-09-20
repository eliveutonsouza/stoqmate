"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { aiJSON, useAITask } from '@/features/ai/use-ai-task';
import { FC_BASE } from '@/features/ai-flows/fc-base';
import { variantLabel } from '@/lib/attr-colors';
import { catById } from '@/lib/mock';
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

export function AIForecast() {
  const navigate = useNavigate();
  const [result, setResult] = React.useState(null);
  const [decided, setDecided] = React.useState({});
  const task = useAITask();

  const run = () => task.run(async () => {
    const data = await aiJSON({
      system: 'Você é analista de reposição de estoque no varejo brasileiro. Ajusta a sugestão de compra considerando sazonalidade, tendência e calendário comercial.',
      prompt: `Data de hoje: 18 de setembro de 2026. Loja: varejo multicategoria em São Paulo, 4 unidades.
A sugestão ingênua atual = média de venda de 30 dias ajustada pelo prazo do fornecedor. Ela ignora sazonalidade e tendência.

Produtos a repor (saldo atual, média de venda em 30 dias, prazo do fornecedor em dias, sugestão ingênua):
${FC_BASE.map(p => `${p.sku} | ${p.name} ${variantLabel(p.attrs)} | categoria ${catById(p.cat).name} | saldo ${p.stock} | media30 ${p.avg30} | prazo ${p.lead}d | ingenua ${p.naive}`).join('\n')}

Para cada SKU, proponha a quantidade ajustada e explique. Considere Black Friday (novembro), Natal, volta às aulas, e o clima de primavera/verão no hemisfério sul.
Devolva JSON:
{"items":[{"sku":"...","suggested":numero,"deltaPct":numero,"confidence":0-100,
 "drivers":["fator 1","fator 2","fator 3"],"risk":"o que acontece se errar, uma frase curta"}]}`,
      max_tokens: 1800,
    });
    setResult(data.items || []);
    return data;
  });

  const decide = (sku, v) => setDecided(d => ({ ...d, [sku]: v }));

  return (
    <StoreShell route="/ai/forecast" breadcrumb={['IA', 'Previsão de demanda']} navigate={navigate}>
      <PageHeader
        title="Previsão de demanda"
        sub="A reposição padrão usa média de 30 dias. Aqui a IA acrescenta sazonalidade, tendência e calendário."
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
              desc="A IA vai comparar a sugestão ingênua com uma projeção que considera sazonalidade, tendência de 3 meses e calendário comercial. Nada é comprado sem sua aprovação."
              action={<button onClick={run} className="btn btn-primary"><I.Sparkle size={13} /> Calcular previsão</button>}
            />
          </div>
        )}
        {task.state === 'running' && <AIThinking label="Projetando demanda dos próximos 30 dias" detail="Cruzando histórico, prazo de fornecedor e calendário comercial brasileiro." />}
        {task.state === 'error' && <AIError message={task.error} onRetry={run} />}

        {result && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
              {[
                { l: 'SKUs projetados', v: `${result.length}` },
                { l: 'Sugestão ingênua', v: `${FC_BASE.reduce((s, p) => s + p.naive, 0)} un`, s: 'média de 30 dias' },
                { l: 'Sugestão da IA', v: `${result.reduce((s, r) => s + (r.suggested || 0), 0)} un`, s: 'com sazonalidade', tone: 'accent' },
                { l: 'Confiança média', v: `${Math.round(result.reduce((s, r) => s + (r.confidence || 0), 0) / result.length)}%` },
              ].map((m, i) => (
                <div key={i} style={{ padding: '16px 18px', borderRight: i < 3 ? '1px solid var(--line)' : 'none' }}>
                  <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{m.l}</div>
                  <div style={{ fontSize: 21, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums', marginTop: 4, color: m.tone === 'accent' ? 'var(--accent-text)' : 'var(--fg)' }}>{m.v}</div>
                  {m.s && <div style={{ fontSize: 10.5, color: 'var(--fg-muted)', marginTop: 2 }}>{m.s}</div>}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {FC_BASE.map(p => {
                const r = result.find(x => x.sku === p.sku);
                if (!r) return null;
                const state = decided[p.sku];
                const up = (r.deltaPct || 0) >= 0;
                return (
                  <div key={p.sku} className="card" style={{ overflow: 'hidden', opacity: state === 'reject' ? 0.6 : 1 }}>
                    <div style={{ padding: 16, display: 'flex', gap: 13, alignItems: 'flex-start' }}>
                      <ProductThumb cat={p.cat} attrs={p.attrs} size={34} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: '-0.01em' }}>{p.name}</span>
                          <AttrChip value={variantLabel(p.attrs)} />
                          <CategoryBadge cat={p.cat} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 10, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
                            Saldo <strong style={{ color: p.stock < 5 ? 'var(--danger)' : 'var(--fg)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{p.stock}</strong>
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
                            Ingênua <strong style={{ color: 'var(--fg-muted)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{p.naive}</strong>
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
              <button onClick={() => navigate('/purchase-orders')} className="btn btn-primary btn-sm">
                Aplicar {Object.values(decided).filter(v => v === 'accept').length} e abrir reposição
              </button>
            </div>
          </>
        )}
      </Page>
    </StoreShell>
  );
}

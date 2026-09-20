"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { GAPS } from '@/features/ai-flows/gaps';
import { aiJSON, useAITask } from '@/features/ai/use-ai-task';
import { MOCK, catById } from '@/lib/mock';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Page } from '@/components/ui/page-container';
import { I } from '@/components/icons';
import { ProductThumb } from '@/components/ui/product-thumb';
import { CategoryBadge } from '@/components/ui/category-badge';
import { AttrChip } from '@/components/ui/attr-chip';
import { variantLabel } from '@/lib/attr-colors';
import { ConfidenceBar } from '@/features/ai/confidence-bar';
import { ReviewActions } from '@/features/ai/review-actions';
import { AIThinking } from '@/features/ai/ai-thinking';
import { AIError } from '@/features/ai/ai-error';
import { AIChip } from '@/features/ai/ai-chip';
import { SummaryRow } from '@/components/ui/summary-row';
import { AIQuotaCard } from '@/features/ai/ai-quota-card';

export function AIEnrich() {
  const navigate = useNavigate();
  const [picked, setPicked] = React.useState(new Set(GAPS.map((_, i) => i)));
  const [result, setResult] = React.useState(null);
  const [decided, setDecided] = React.useState({});
  const task = useAITask();

  const run = () => task.run(async () => {
    const targets = [...picked].map(i => GAPS[i]).filter(Boolean);
    const data = await aiJSON({
      system: 'Você completa atributos faltantes no catálogo de um sistema de estoque, usando apenas o que é dedutível do nome do produto.',
      prompt: `Esquemas de categoria (atributo: valores permitidos):
${MOCK.categories.map(c => `${c.name}: ${c.attributes.map(a => a.key + ' [' + a.values.join('/') + ']').join(', ')}`).join('\n')}

Produtos com atributos em branco:
${targets.map(t => `SKU ${t.sku} | categoria ${catById(t.cat).name} | nome "${t.name}" | já conhecido: ${JSON.stringify(t.known)} | faltando: ${t.missing.join(', ')}`).join('\n')}

Para cada produto, proponha valor para os atributos faltando, escolhendo SOMENTE entre os valores permitidos do esquema daquela categoria.
Se o nome não permitir deduzir com segurança, devolva null no valor e confidence abaixo de 60.
Escreva também uma descrição comercial curta em português (máximo 18 palavras).
Devolva JSON:
{"items":[{"sku":"...","filled":{"atributo":"valor ou null"},"description":"...","confidence":0-100,"reason":"uma frase curta"}]}`,
      max_tokens: 1800,
    });
    setResult(data.items || []);
    return data;
  });

  const decide = (sku, v) => setDecided(d => ({ ...d, [sku]: v }));

  return (
    <StoreShell route="/ai/enrich" breadcrumb={['IA', 'Enriquecimento']} navigate={navigate}>
      <PageHeader
        title="Enriquecimento de catálogo"
        sub="41 SKUs importados ficaram com atributo em branco — a IA propõe valores dentro do seu esquema."
        actions={<button onClick={() => navigate('/ai')} className="btn btn-ghost btn-sm">Central de IA</button>}
      />
      <Page>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 16, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', background: 'var(--bg-sunken)',
              border: '1px solid var(--line)', borderRadius: 8,
            }}>
              <span style={{ color: 'var(--fg-muted)', flexShrink: 0 }}><I.Sliders size={15} /></span>
              <span style={{ fontSize: 12.5, color: 'var(--fg-muted)', flex: 1, lineHeight: 1.5 }}>
                A IA só pode escolher entre os valores já cadastrados no esquema de cada categoria —
                ela não inventa atributo nem valor novo.
              </span>
              <button onClick={() => navigate('/categories')} className="btn btn-outline btn-sm">Ver esquemas</button>
            </div>

            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>SKUs com lacuna</h3>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Selecione o lote a processar. Mostrando 6 de 41.</p>
                </div>
                <button onClick={run} disabled={task.state === 'running' || picked.size === 0} className="btn btn-primary btn-sm"
                  style={{ opacity: task.state === 'running' || !picked.size ? 0.6 : 1 }}>
                  <I.Sparkle size={12} /> {task.state === 'running' ? 'Analisando…' : `Completar ${picked.size} SKUs`}
                </button>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>
                      <input type="checkbox" checked={picked.size === GAPS.length}
                        onChange={() => setPicked(picked.size === GAPS.length ? new Set() : new Set(GAPS.map((_, i) => i)))} />
                    </th>
                    <th>Produto</th><th>Categoria</th><th>Já preenchido</th><th>Faltando</th>
                    {result && <th>Sugestão da IA</th>}
                    {result && <th>Confiança</th>}
                    {result && <th style={{ width: 110 }}></th>}
                  </tr>
                </thead>
                <tbody>
                  {GAPS.map((g, i) => {
                    const r = result ? result.find(x => x.sku === g.sku) : null;
                    const state = decided[g.sku];
                    return (
                      <tr key={g.sku} style={{ background: picked.has(i) && !result ? 'var(--accent-soft)' : undefined, opacity: state === 'reject' ? 0.5 : 1 }}>
                        <td>
                          <input type="checkbox" checked={picked.has(i)} onChange={() => {
                            const n = new Set(picked); if (n.has(i)) n.delete(i); else n.add(i); setPicked(n);
                          }} />
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <ProductThumb cat={g.cat} attrs={g.known} size={26} />
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 500 }}>{g.name}</div>
                              <div style={{ fontSize: 10, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{g.sku}</div>
                            </div>
                          </div>
                        </td>
                        <td><CategoryBadge cat={g.cat} /></td>
                        <td><AttrChip value={variantLabel(g.known) || '—'} /></td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {g.missing.map(m => <span key={m} className="badge badge-warning">{m}</span>)}
                          </div>
                        </td>
                        {result && (
                          <td>
                            {r && r.filled
                              ? <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                                  {Object.entries(r.filled).map(([k, v]) => (
                                    v ? <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 7px', borderRadius: 4, background: 'var(--accent-soft)', color: 'var(--accent-text)', fontSize: 11, fontWeight: 500 }}>
                                      {k}: {v}
                                    </span> : <span key={k} className="badge">{k}: não deduzível</span>
                                  ))}
                                </div>
                              : <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>—</span>}
                          </td>
                        )}
                        {result && <td>{r ? <ConfidenceBar value={r.confidence || 0} width={50} /> : null}</td>}
                        {result && (
                          <td>
                            {r && <ReviewActions compact accepted={state === 'accept'} rejected={state === 'reject'}
                              onAccept={() => decide(g.sku, 'accept')} onReject={() => decide(g.sku, 'reject')} />}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {task.state === 'running' && <AIThinking label="Deduzindo atributos" detail="Só valores já existentes no esquema de cada categoria são considerados." />}
            {task.state === 'error' && <AIError message={task.error} onRetry={run} />}

            {result && (
              <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 9 }}>
                    Descrições propostas <AIChip />
                  </h3>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Curtas, para etiqueta e vitrine. Edite antes de aceitar se quiser.</p>
                </div>
                {result.map(r => (
                  <div key={r.sku} style={{ padding: '12px 18px', borderBottom: '1px solid var(--line-soft)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)', width: 120, flexShrink: 0, marginTop: 2 }}>{r.sku}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12.5, lineHeight: 1.5 }}>{r.description || '—'}</div>
                      {r.reason && <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 4 }}>· {r.reason}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 10 }}>Lote</div>
              <SummaryRow label="SKUs selecionados" value={`${picked.size}`} />
              {result && <>
                <SummaryRow label="Com sugestão" value={`${result.filter(r => r.filled && Object.values(r.filled).some(v => v)).length}`} tone="success" />
                <SummaryRow label="Sem dedução segura" value={`${result.filter(r => !r.filled || !Object.values(r.filled).some(v => v)).length}`} />
                <div style={{ borderTop: '1px solid var(--line)', marginTop: 8, paddingTop: 8 }}>
                  <SummaryRow label="Aceitos" value={`${Object.values(decided).filter(v => v === 'accept').length}`} strong />
                </div>
              </>}
            </div>

            <button onClick={() => navigate('/products')} disabled={!result}
              className="btn btn-primary btn-lg" style={{ justifyContent: 'center', width: '100%', opacity: result ? 1 : 0.45 }}>
              Aplicar aos aceitos
            </button>
            <AIQuotaCard compact />
          </div>
        </div>
      </Page>
    </StoreShell>
  );
}

// === /ai/forecast ===

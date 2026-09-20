"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { SAMPLE_NF } from '@/features/ai-flows/sample-nf';
import { aiJSON, useAITask } from '@/features/ai/use-ai-task';
import { CATALOG } from '@/lib/catalog';
import { variantLabel } from '@/lib/attr-colors';
import { MOCK } from '@/lib/mock';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Page } from '@/components/ui/page-container';
import { MovementNav } from '@/features/stock/movement-nav';
import { FormCard } from '@/components/ui/form-card';
import { I } from '@/components/icons';
import { Field } from '@/components/ui/field';
import { TextareaInput } from '@/components/ui/textarea-input';
import { AIThinking } from '@/features/ai/ai-thinking';
import { AIError } from '@/features/ai/ai-error';
import { AIChip } from '@/features/ai/ai-chip';
import { brl } from '@/lib/format';
import { ConfidenceBar } from '@/features/ai/confidence-bar';
import { ReviewActions } from '@/features/ai/review-actions';
import { SummaryRow } from '@/components/ui/summary-row';
import { SelectInput } from '@/components/ui/select-input';
import { AIQuotaCard } from '@/features/ai/ai-quota-card';

export function EntryOCR() {
  const navigate = useNavigate();
  const [text, setText] = React.useState(SAMPLE_NF);
  const [rows, setRows] = React.useState(null);
  const [decided, setDecided] = React.useState({});
  const task = useAITask();

  const catalogueHint = CATALOG.map(p => `${p.sku} | ${p.brand} ${p.name} | ${variantLabel(p.attrs)} | custo ~${(p.sale * 0.53).toFixed(2)}`).join('\n');

  const extract = () => task.run(async () => {
    const data = await aiJSON({
      system: 'Você lê notas fiscais brasileiras (DANFE) de entrada de mercadoria para um sistema de estoque multi-loja e devolve os itens estruturados.',
      prompt: `Catálogo atual da loja (SKU | produto | variação | custo aproximado):
${catalogueHint}

Categorias disponíveis e seus atributos:
${MOCK.categories.map(c => `${c.name} (prefixo ${c.code}, unidade ${c.unit}): ${c.attributes.map(a => a.label + ' [' + a.values.join('/') + ']').join(', ')}`).join('\n')}

Texto da nota fiscal:
"""
${text}
"""

Extraia os itens. Para cada um, decida se casa com um SKU do catálogo acima ou se é produto novo.
Devolva JSON com esta forma exata:
{"supplier":"nome do fornecedor","doc":"numero da nota","total":numero,
 "items":[{"line":1,"description":"texto original do item","qty":numero,"unitCost":numero,
   "match":"existing"|"new","sku":"SKU casado ou SKU sugerido","productName":"nome limpo",
   "category":"nome da categoria","attributes":{"chave":"valor"},"confidence":0-100,
   "reason":"por que casou ou por que é novo, em uma frase curta em português"}]}`,
      max_tokens: 2000,
    });
    setRows(data.items || []);
    return data;
  });

  const decide = (i, v) => setDecided(d => ({ ...d, [i]: v }));
  const accepted = rows ? rows.filter((_, i) => decided[i] !== 'reject') : [];
  const totalValue = accepted.reduce((s, r) => s + (r.qty || 0) * (r.unitCost || 0), 0);
  const newOnes = accepted.filter(r => r.match === 'new').length;

  return (
    <StoreShell route="/stock/entry/ocr" breadcrumb={['Estoque', 'Entrada por nota']} navigate={navigate}>
      <PageHeader
        title="Entrada por leitura de nota"
        sub="A IA lê a nota e monta a entrada. Você confere item por item antes de gravar."
        actions={<button onClick={() => navigate('/stock/entry')} className="btn btn-ghost btn-sm">Lançar manualmente</button>}
      />
      <Page>
        <MovementNav route="/stock/entry" navigate={navigate} />

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 16, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <FormCard title="Origem da nota" desc="Em produção: foto, PDF ou XML. Aqui, o texto da nota alimenta a mesma extração." cols={1}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  { i: <I.QR size={15} />, t: 'Foto da nota', d: 'Papel do fornecedor' },
                  { i: <I.Download size={15} />, t: 'PDF ou XML', d: 'DANFE eletrônica' },
                  { i: <I.Layers size={15} />, t: 'Texto colado', d: 'Em uso nesta demo', on: true },
                ].map(o => (
                  <div key={o.t} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px',
                    border: '1px solid ' + (o.on ? 'var(--accent)' : 'var(--line)'),
                    background: o.on ? 'var(--accent-soft)' : 'var(--bg-elev)',
                    borderRadius: 7,
                  }}>
                    <span style={{ color: o.on ? 'var(--accent-text)' : 'var(--fg-muted)', display: 'flex', flexShrink: 0 }}>{o.i}</span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: 'var(--fg)' }}>{o.t}</span>
                      <span style={{ display: 'block', fontSize: 11, color: 'var(--fg-muted)' }}>{o.d}</span>
                    </span>
                  </div>
                ))}
              </div>
              <Field label="Texto da nota" hint="Edite para testar com outra nota — a extração é real.">
                <TextareaInput value={text} onChange={(e) => setText(e.target.value)} style={{ minHeight: 168, fontFamily: 'var(--font-mono)', fontSize: 11.5 }} />
              </Field>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={extract} disabled={task.state === 'running'} className="btn btn-primary"
                  style={{ opacity: task.state === 'running' ? 0.6 : 1 }}>
                  <I.Sparkle size={13} /> {task.state === 'running' ? 'Lendo a nota…' : 'Ler nota com IA'}
                </button>
                <span style={{ fontSize: 11.5, color: 'var(--fg-muted)' }}>Consome 5 créditos de IA</span>
              </div>
            </FormCard>

            {task.state === 'running' && (
              <AIThinking label="Extraindo itens da nota" detail="Casando cada linha com os SKUs do seu catálogo pelo código de barras e pelo nome." />
            )}
            {task.state === 'error' && <AIError message={task.error} onRetry={extract} />}

            {rows && rows.length > 0 && (
              <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 9 }}>
                      Itens extraídos <AIChip />
                    </h3>
                    <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>
                      {task.data && task.data.supplier ? `${task.data.supplier} · nota ${task.data.doc}` : 'Confira antes de gravar.'}
                    </p>
                  </div>
                  <button onClick={() => setDecided({})} className="btn btn-ghost btn-sm">Restaurar tudo</button>
                </div>
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: 28 }}>#</th><th>Item na nota</th><th>SKU</th><th>Situação</th>
                      <th className="num">Qtd</th><th className="num">Custo un.</th><th>Confiança</th><th style={{ width: 110 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => {
                      const state = decided[i];
                      const isNew = r.match === 'new';
                      return (
                        <React.Fragment key={i}>
                          <tr style={{ opacity: state === 'reject' ? 0.5 : 1 }}>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)' }}>{r.line || i + 1}</td>
                            <td>
                              <div style={{ fontSize: 13, fontWeight: 500 }}>{r.productName || r.description}</div>
                              <div style={{ fontSize: 10.5, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{r.description}</div>
                            </td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: isNew ? 'var(--accent-text)' : 'var(--fg-muted)' }}>{r.sku}</td>
                            <td>
                              {isNew
                                ? <span className="badge badge-accent">Produto novo</span>
                                : <span className="badge badge-success"><I.Check size={10} stroke={3} /> Casou</span>}
                            </td>
                            <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.qty}</td>
                            <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{brl(r.unitCost || 0)}</td>
                            <td><ConfidenceBar value={r.confidence || 0} width={52} /></td>
                            <td>
                              <ReviewActions compact
                                accepted={state === 'accept'} rejected={state === 'reject'}
                                onAccept={() => decide(i, 'accept')} onReject={() => decide(i, 'reject')} />
                            </td>
                          </tr>
                          {r.reason && state !== 'reject' && (
                            <tr>
                              <td></td>
                              <td colSpan={7} style={{ paddingTop: 0, paddingBottom: 9, borderBottom: '1px solid var(--line-soft)' }}>
                                <span style={{ fontSize: 11.5, color: 'var(--fg-muted)' }}>
                                  <span style={{ color: 'var(--accent-text)' }}>·</span> {r.reason}
                                  {isNew && r.category && <> Categoria proposta: <strong style={{ color: 'var(--fg)', fontWeight: 500 }}>{r.category}</strong>
                                    {r.attributes && Object.keys(r.attributes).length > 0 && <> · {Object.entries(r.attributes).map(([k, v]) => `${k}: ${v}`).join(' · ')}</>}</>}
                                </span>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {rows && newOnes > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', background: 'var(--accent-soft)',
                border: '1px solid var(--accent)', borderRadius: 8,
              }}>
                <span style={{ color: 'var(--accent-text)', flexShrink: 0 }}><I.Plus size={15} /></span>
                <span style={{ fontSize: 12.5, color: 'var(--fg)', flex: 1, lineHeight: 1.5 }}>
                  <strong>{newOnes} produto(s) novo(s)</strong> serão cadastrados junto com a entrada, já classificados
                  na categoria proposta. Você pode revisar o cadastro depois no catálogo.
                </span>
              </div>
            )}
          </div>

          <div style={{ position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 10 }}>Resumo da entrada</div>
              {rows ? (
                <>
                  <SummaryRow label="Itens aceitos" value={`${accepted.length} de ${rows.length}`} />
                  <SummaryRow label="Produtos novos" value={`${newOnes}`} tone={newOnes ? 'warning' : undefined} />
                  <SummaryRow label="Unidades" value={`${accepted.reduce((s, r) => s + (r.qty || 0), 0)}`} />
                  <div style={{ borderTop: '1px solid var(--line)', marginTop: 8, paddingTop: 8 }}>
                    <SummaryRow label="Total da entrada" value={brl(totalValue)} strong />
                  </div>
                  {task.data && task.data.total ? (
                    <div style={{ fontSize: 11, marginTop: 8, color: Math.abs(task.data.total - totalValue) < 1 ? 'var(--success)' : 'var(--warning)', lineHeight: 1.5 }}>
                      {Math.abs(task.data.total - totalValue) < 1
                        ? 'Confere com o total impresso na nota.'
                        : `Total da nota: ${brl(task.data.total)} — diferença de ${brl(Math.abs(task.data.total - totalValue))} pelos itens descartados.`}
                    </div>
                  ) : null}
                </>
              ) : (
                <div style={{ fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.55 }}>
                  Leia a nota para ver o resumo. Nada é gravado antes da sua confirmação.
                </div>
              )}
            </div>

            <Field label="Unidade de destino">
              <SelectInput value="Loja Centro" onChange={() => {}} options={MOCK.store.siblings.map(s => s.name)} />
            </Field>

            <button onClick={() => navigate('/stock/history')} disabled={!rows || accepted.length === 0}
              className="btn btn-primary btn-lg"
              style={{ justifyContent: 'center', width: '100%', opacity: rows && accepted.length ? 1 : 0.45 }}>
              Confirmar entrada de {accepted.length} item(ns)
            </button>
            <button onClick={() => navigate('/stock')} className="btn btn-ghost" style={{ justifyContent: 'center', width: '100%' }}>Cancelar</button>

            <AIQuotaCard compact />
          </div>
        </div>
      </Page>
    </StoreShell>
  );
}

// === /ai/enrich ===

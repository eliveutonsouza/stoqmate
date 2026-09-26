"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { unwrap, useAITask } from '@/features/ai/use-ai-task';
import { extractInvoiceAction } from '@/features/ai/actions';
import { confirmInvoiceEntryAction } from '@/features/ai-flows/actions';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Page } from '@/components/ui/page-container';
import { MovementNav } from '@/features/stock/movement-nav';
import { FormCard } from '@/components/ui/form-card';
import { I } from '@/components/icons';
import { useDefaultStoreId } from '@/components/layout/shell-context';
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

export function EntryOCR({ stores, quota }) {
  const navigate = useNavigate();
  const [mode, setMode] = React.useState('photo');
  const [text, setText] = React.useState('');
  const [file, setFile] = React.useState(null);
  const [rows, setRows] = React.useState(null);
  const [decided, setDecided] = React.useState({});
  const defaultStoreId = useDefaultStoreId(stores);
  const [storeId, setStoreId] = React.useState(defaultStoreId);
  const [confirming, setConfirming] = React.useState(false);
  const [error, setError] = React.useState('');
  const task = useAITask();

  const ready = mode === 'text' ? text.trim().length > 0 : !!file;

  const pickFile = async (e) => {
    const picked = e.target.files?.[0] ?? null;
    e.target.value = '';
    setFile(picked && picked.type.startsWith('image/') ? await shrinkImage(picked) : picked);
  };

  const extract = () => task.run(async () => {
    const form = new FormData();
    if (mode === 'text') form.set('text', text);
    else if (file) form.set('file', file);
    const data = unwrap(await extractInvoiceAction(form));
    setRows(data.items || []);
    return data;
  });

  const decide = (i, v) => setDecided(d => ({ ...d, [i]: v }));
  const accepted = rows ? rows.filter((_, i) => decided[i] !== 'reject') : [];
  const totalValue = accepted.reduce((s, r) => s + (r.qty || 0) * (r.unitCost || 0), 0);
  const newOnes = accepted.filter(r => r.match === 'new').length;

  const confirm = () => {
    setError('');
    setConfirming(true);
    confirmInvoiceEntryAction({
      storeId,
      invoiceRef: task.data?.doc || '',
      items: accepted.map(r => ({
        match: r.match, sku: r.sku, productName: r.productName, category: r.category,
        attributes: r.attributes || {}, qty: r.qty, unitCost: r.unitCost,
      })),
    }).then((result) => {
      setConfirming(false);
      if (result?.error) { setError(result.error); return; }
      navigate('/stock/history');
    });
  };

  return (
    <StoreShell route="/stock/entry/ocr" breadcrumb={['Estoque', 'Entrada por nota']} navigate={navigate}>
      <PageHeader
        title="Entrada por leitura de nota"
        sub="A IA lê a nota e monta a entrada. Você confere item por item antes de gravar."
        actions={<button onClick={() => navigate('/stock/entry')} className="btn btn-ghost btn-sm">Lançar manualmente</button>}
      />
      <Page>
        <MovementNav route="/stock/entry" navigate={navigate} />

        <div className="split-aside" style={{ '--aside': '320px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <FormCard title="Origem da nota" desc="Foto do papel, PDF da DANFE ou o texto da nota. A IA extrai os itens e casa com o seu catálogo." cols={1}>
              <div className="g3" role="radiogroup" aria-label="Origem da nota" style={{ gap: 8 }}>
                {[
                  { id: 'photo', i: <I.QR size={15} />, t: 'Foto da nota', d: 'Papel do fornecedor' },
                  { id: 'pdf', i: <I.Download size={15} />, t: 'PDF da DANFE', d: 'Arquivo eletrônico' },
                  { id: 'text', i: <I.Layers size={15} />, t: 'Texto colado', d: 'Copiado de e-mail ou sistema' },
                ].map(o => {
                  const on = mode === o.id;
                  return (
                    <button key={o.id} type="button" role="radio" aria-checked={on}
                      onClick={() => { setMode(o.id); setFile(null); }} style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', textAlign: 'left',
                        border: '1px solid ' + (on ? 'var(--accent)' : 'var(--line)'),
                        background: on ? 'var(--accent-soft)' : 'var(--bg-elev)',
                        borderRadius: 7, fontFamily: 'inherit', cursor: 'pointer',
                      }}>
                      <span style={{ color: on ? 'var(--accent-text)' : 'var(--fg-muted)', display: 'flex', flexShrink: 0 }}>{o.i}</span>
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: 'var(--fg)' }}>{o.t}</span>
                        <span style={{ display: 'block', fontSize: 11, color: 'var(--fg-muted)' }}>{o.d}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              {mode === 'text' ? (
                <Field label="Texto da nota">
                  <TextareaInput value={text} onChange={(e) => setText(e.target.value)} placeholder="Cole aqui o conteúdo da nota fiscal (emitente, itens, quantidades e valores)."
                    style={{ minHeight: 168, fontFamily: 'var(--font-mono)', fontSize: 11.5 }} />
                </Field>
              ) : (
                <Field label={mode === 'pdf' ? 'Arquivo PDF' : 'Foto da nota'} hint={mode === 'pdf' ? 'PDF até 3,5 MB.' : 'JPG, PNG ou WEBP. A foto é reduzida antes do envio.'}>
                  <label className="btn btn-outline" style={{ justifyContent: 'flex-start', width: '100%' }}>
                    <I.Download size={13} />
                    <span className="truncate">{file ? file.name : mode === 'pdf' ? 'Escolher PDF…' : 'Tirar foto ou escolher imagem…'}</span>
                    <input type="file" onChange={pickFile} style={{ display: 'none' }}
                      accept={mode === 'pdf' ? 'application/pdf' : 'image/jpeg,image/png,image/webp'}
                      {...(mode === 'photo' ? { capture: 'environment' } : {})} />
                  </label>
                </Field>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={extract} disabled={task.state === 'running' || !ready} className="btn btn-primary"
                  style={{ opacity: task.state === 'running' || !ready ? 0.5 : 1 }}>
                  <I.Sparkle size={13} /> {task.state === 'running' ? 'Lendo a nota…' : 'Ler nota com IA'}
                </button>
                <span style={{ fontSize: 11.5, color: 'var(--fg-muted)' }}>Consome {quota?.costs?.ocr} créditos de IA</span>
              </div>
            </FormCard>

            {task.state === 'running' && (
              <AIThinking label="Extraindo itens da nota" detail="Casando cada linha com os SKUs do seu catálogo pelo código de barras e pelo nome." />
            )}
            {task.state === 'error' && <AIError message={task.error} onRetry={extract} />}

            {rows && rows.length > 0 && (
              <div className="card table-scroll">
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

            {error && (
              <div style={{ padding: '10px 12px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 7, fontSize: 12.5 }}>{error}</div>
            )}
          </div>

          <div data-sticky style={{ position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
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
              <SelectInput value={storeId} onChange={setStoreId} options={stores.map(s => ({ value: s.id, label: s.name }))} />
            </Field>

            <button onClick={confirm} disabled={!rows || accepted.length === 0 || confirming || !storeId}
              className="btn btn-primary btn-lg"
              style={{ justifyContent: 'center', width: '100%', opacity: rows && accepted.length && !confirming ? 1 : 0.45 }}>
              {confirming ? 'Gravando…' : `Confirmar entrada de ${accepted.length} item(ns)`}
            </button>
            <button onClick={() => navigate('/stock')} className="btn btn-ghost" style={{ justifyContent: 'center', width: '100%' }}>Cancelar</button>

            <AIQuotaCard compact quota={quota} />
          </div>
        </div>
      </Page>
    </StoreShell>
  );
}

// Foto de celular passa fácil de 4 MB; 1600px no lado maior mantém a nota
// legível e cabe folgado no limite de upload.
function shrinkImage(file, maxSide = 1600) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        resolve(blob ? new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }) : file);
      }, 'image/jpeg', 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

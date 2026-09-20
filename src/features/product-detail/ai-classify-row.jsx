"use client";

import * as React from 'react';
import { aiJSON, useAITask } from '@/features/ai/use-ai-task';
import { MOCK } from '@/lib/mock';
import { AIChip } from '@/features/ai/ai-chip';
import { TextInput } from '@/components/ui/text-input';
import { I } from '@/components/icons';
import { AIError } from '@/features/ai/ai-error';
import { ConfidenceBar } from '@/features/ai/confidence-bar';
import { AIWhy } from '@/features/ai/ai-why';

export function AIClassifyRow({ onApply }) {
  const [raw, setRaw] = React.useState('Fone de ouvido Bluetooth com cancelamento de ruído, preto, 128 GB — Foneclear');
  const [sug, setSug] = React.useState(null);
  const [applied, setApplied] = React.useState(false);
  const task = useAITask();

  const classify = () => task.run(async () => {
    const data = await aiJSON({
      system: 'Você classifica produtos no catálogo de um sistema de estoque, escolhendo somente entre as categorias e valores de atributo já cadastrados.',
      prompt: `Categorias disponíveis e seus atributos (atributo: valores permitidos):\n${MOCK.categories.map(c => `${c.name} (unidade ${c.unit}): ${c.attributes.map(a => a.key + ' [' + a.values.join('/') + ']').join(', ')}`).join('\n')}\n\nDescrição livre do produto, como o lojista digitou:\n"${raw}"\n\nClassifique. Use apenas categoria existente e apenas valores permitidos do esquema dela. Se um atributo não for dedutível, omita a chave.\nDevolva JSON:\n{"category":"nome exato da categoria","brand":"marca","productName":"nome limpo e curto do produto","attributes":{"chave":"valor"},"unit":"unidade de medida","confidence":0-100,"reasons":["por que essa categoria","como deduziu os atributos"]}`,
      max_tokens: 900,
    });
    setSug(data); setApplied(false);
    return data;
  });

  return (
    <div style={{
      border: '1px solid var(--accent)', background: 'var(--accent-soft)',
      borderRadius: 9, padding: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
        <AIChip label="Classificar com IA" size="md" />
        <span style={{ fontSize: 12, color: 'var(--fg-muted)', flex: 1 }}>
          Descreva o produto como vier do fornecedor — a IA propõe categoria, atributos e unidade.
        </span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <TextInput value={raw} onChange={(e) => setRaw(e.target.value)} placeholder="Ex.: camiseta algodão pima branca tamanho M" />
        </div>
        <button onClick={classify} disabled={task.state === 'running'} className="btn btn-primary"
          style={{ flexShrink: 0, opacity: task.state === 'running' ? 0.6 : 1 }}>
          <I.Sparkle size={13} /> {task.state === 'running' ? 'Analisando…' : 'Classificar'}
        </button>
      </div>

      {task.state === 'error' && <div style={{ marginTop: 10 }}><AIError message={task.error} onRetry={classify} /></div>}

      {sug && task.state === 'done' && (
        <div style={{ marginTop: 12, background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 8, padding: 13 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600 }}>{sug.productName || '—'}</span>
            <span className="badge">{sug.category}</span>
            {sug.brand && <span className="badge">{sug.brand}</span>}
            {sug.attributes && Object.entries(sug.attributes).map(([k, v]) => (
              <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 7px', borderRadius: 4, background: 'var(--accent-soft)', color: 'var(--accent-text)', fontSize: 11, fontWeight: 500 }}>
                {k}: {v}
              </span>
            ))}
            <div style={{ flex: 1 }}></div>
            <ConfidenceBar value={sug.confidence || 0} />
          </div>
          {sug.reasons && sug.reasons.length > 0 && <AIWhy reasons={sug.reasons} />}
          <div style={{ display: 'flex', gap: 8, marginTop: 11, alignItems: 'center' }}>
            {applied ? (
              <span className="badge badge-success"><I.Check size={10} stroke={3} /> Aplicado ao formulário</span>
            ) : (
              <>
                <button onClick={() => { onApply(sug); setApplied(true); }} className="btn btn-primary btn-sm">
                  <I.Check size={11} stroke={2.6} /> Preencher formulário
                </button>
                <button onClick={() => { setSug(null); task.reset(); }} className="btn btn-ghost btn-sm">Descartar</button>
              </>
            )}
            <div style={{ flex: 1 }}></div>
            <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>Você pode editar tudo depois de aplicar</span>
          </div>
        </div>
      )}
    </div>
  );
}

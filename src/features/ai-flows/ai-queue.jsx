"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { QUEUE } from '@/features/ai-flows/queue';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Page } from '@/components/ui/page-container';
import { QUEUE_SRC } from '@/features/ai-flows/queue-src';
import { I } from '@/components/icons';
import { AIChip } from '@/features/ai/ai-chip';
import { ConfidenceBar } from '@/features/ai/confidence-bar';
import { ReviewActions } from '@/features/ai/review-actions';
import { AIWhy } from '@/features/ai/ai-why';

export function AIQueue() {
  const navigate = useNavigate();
  const [decided, setDecided] = React.useState({});
  const [open, setOpen] = React.useState(1);
  const [filter, setFilter] = React.useState('all');

  const decide = (id, v) => setDecided(d => ({ ...d, [id]: v }));
  const rows = filter === 'all' ? QUEUE : QUEUE.filter(q => q.src === filter);
  const pending = QUEUE.filter(q => !decided[q.id]).length;

  return (
    <StoreShell route="/ai/queue" breadcrumb={['IA', 'Fila de revisão']} navigate={navigate}>
      <PageHeader
        title="Fila de revisão"
        sub={`${pending} sugestões pendentes · nada é aplicado sem sua aprovação`}
        actions={(
          <>
            <button onClick={() => setDecided(Object.fromEntries(QUEUE.map(q => [q.id, 'reject'])))} className="btn btn-ghost btn-sm">Descartar todas</button>
            <button onClick={() => setDecided(Object.fromEntries(QUEUE.filter(q => q.conf >= 90).map(q => [q.id, 'accept'])))} className="btn btn-outline btn-sm">
              Aceitar as acima de 90%
            </button>
          </>
        )}
        tabs={[
          { id: 'all', label: `Todas · ${QUEUE.length}` },
          { id: 'ocr', label: 'OCR · 2' },
          { id: 'forecast', label: 'Previsão · 1' },
          { id: 'anomaly', label: 'Anomalia · 2' },
          { id: 'classify', label: 'Classificação · 1' },
          { id: 'price', label: 'Preço · 1' },
          { id: 'enrich', label: 'Enriquecimento · 1' },
        ]}
        activeTab={filter}
        onTab={setFilter}
      />
      <Page width={1040}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
          {[
            { l: 'Pendentes', v: `${pending}`, s: 'de ' + QUEUE.length + ' geradas hoje' },
            { l: 'Aceitas', v: `${Object.values(decided).filter(v => v === 'accept').length}`, s: 'nesta sessão', tone: 'ok' },
            { l: 'Confiança média', v: '83%', s: 'piso configurado: 70%' },
            { l: 'Taxa de aceite histórica', v: '84%', s: 'últimos 30 dias', tone: 'ok' },
          ].map((m, i) => (
            <div key={i} style={{ padding: '14px 16px', borderRight: i < 3 ? '1px solid var(--line)' : 'none' }}>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{m.l}</div>
              <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums', marginTop: 4, color: m.tone === 'ok' ? 'var(--success)' : 'var(--fg)' }}>{m.v}</div>
              <div style={{ fontSize: 10.5, color: 'var(--fg-muted)', marginTop: 2 }}>{m.s}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map(q => {
            const [label, icon] = QUEUE_SRC[q.src];
            const Ico = I[icon] || I.Sparkle;
            const state = decided[q.id];
            const expanded = open === q.id && !state;
            return (
              <div key={q.id} className="card" style={{ overflow: 'hidden', opacity: state ? 0.62 : 1 }}>
                <div style={{ padding: 16, display: 'flex', gap: 13, alignItems: 'flex-start' }}>
                  <span style={{
                    width: 30, height: 30, borderRadius: 7, flexShrink: 0,
                    background: 'var(--accent-soft)', color: 'var(--accent-text)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}><Ico size={15} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: '-0.01em' }}>{q.title}</span>
                      <span className="badge">{label}</span>
                      <AIChip />
                    </div>
                    <p style={{ margin: '5px 0 0', fontSize: 12.5, color: 'var(--fg-muted)', lineHeight: 1.5 }}>{q.detail}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
                      <ConfidenceBar value={q.conf} />
                      <button onClick={() => setOpen(expanded ? null : q.id)} className="btn btn-ghost btn-sm" style={{ padding: '0 6px' }}>
                        {expanded ? 'Ocultar' : 'Por quê?'}
                      </button>
                      {q.conf < 80 && !state && (
                        <span style={{ fontSize: 11, color: 'var(--warning)' }}>Confiança baixa — confira antes de aceitar</span>
                      )}
                    </div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    <ReviewActions
                      accepted={state === 'accept'} rejected={state === 'reject'}
                      onAccept={() => decide(q.id, 'accept')} onReject={() => decide(q.id, 'reject')}
                    />
                  </div>
                </div>
                {expanded && (
                  <div style={{ padding: '0 16px 16px 59px' }}>
                    <AIWhy reasons={q.why} />
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button onClick={() => navigate(q.src === 'ocr' ? '/stock/entry/ocr' : q.src === 'forecast' ? '/ai/forecast' : q.src === 'anomaly' ? '/ai/anomalies' : q.src === 'enrich' ? '/ai/enrich' : q.src === 'price' ? '/products/pricing' : '/products/new')}
                        className="btn btn-outline btn-sm">Abrir em detalhe</button>
                      <button className="btn btn-ghost btn-sm">Editar antes de aceitar</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ padding: '12px 14px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 8, display: 'flex', gap: 11, alignItems: 'center' }}>
          <span style={{ color: 'var(--fg-muted)', flexShrink: 0 }}><I.Activity size={15} /></span>
          <div style={{ fontSize: 12, color: 'var(--fg-muted)', flex: 1, lineHeight: 1.5 }}>
            Cada aceite e cada recusa entram no log de alterações com autor e horário. A recusa também alimenta
            o ajuste de confiança das próximas sugestões do mesmo tipo.
          </div>
          <button onClick={() => navigate('/settings/audit')} className="btn btn-outline btn-sm">Ver log</button>
        </div>
      </Page>
    </StoreShell>
  );
}

// === /ai/anomalies ===

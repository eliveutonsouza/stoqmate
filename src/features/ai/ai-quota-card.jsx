"use client";

import { AI_QUOTA } from '@/features/ai/ai-constants';
import { AIChip } from '@/features/ai/ai-chip';
import { I } from '@/components/icons';

export function AIQuotaCard({ navigate, compact }) {
  const pct = (AI_QUOTA.used / AI_QUOTA.limit) * 100;
  const tone = pct > 90 ? 'var(--danger)' : pct > 75 ? 'var(--warning)' : 'var(--accent)';
  return (
    <div className="card" style={{ padding: compact ? 14 : 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', flex: 1 }}>Cota de IA · plano {AI_QUOTA.plan}</span>
        <AIChip />
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums' }}>
          {AI_QUOTA.used.toLocaleString('pt-BR')}
        </span>
        <span style={{ fontSize: 13, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>
          / {AI_QUOTA.limit.toLocaleString('pt-BR')} créditos
        </span>
      </div>
      <div style={{ height: 6, background: 'var(--bg-sunken)', borderRadius: 3, marginTop: 10 }}>
        <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: tone, borderRadius: 3 }}></div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 8 }}>
        <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{pct.toFixed(0)}% usado neste mês</span>
        <span style={{ fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>zera em {AI_QUOTA.resets}</span>
      </div>
      {!compact && (
        <>
          <div style={{ borderTop: '1px solid var(--line)', marginTop: 14, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {AI_QUOTA.byFeature.map(f => (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ fontSize: 12, flex: 1 }}>{f.label}</span>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>{f.used} {f.unit}</span>
              </div>
            ))}
          </div>
          {pct > 75 && (
            <div style={{
              marginTop: 14, padding: '11px 13px', borderRadius: 7,
              background: pct > 90 ? 'var(--danger-soft)' : 'var(--warning-soft)',
              border: '1px solid ' + (pct > 90 ? 'var(--danger)' : 'var(--warning)'),
              display: 'flex', gap: 10,
            }}>
              <span style={{ color: pct > 90 ? 'var(--danger)' : 'var(--warning)', flexShrink: 0, marginTop: 1 }}><I.Alert size={14} /></span>
              <div style={{ fontSize: 11, color: 'var(--fg)', lineHeight: 1.5, flex: 1 }}>
                Você usou {pct.toFixed(0)}% dos créditos. Ao esgotar, a IA pausa até {AI_QUOTA.resets} —
                o resto do sistema continua funcionando normalmente. Você pode comprar um pacote adicional.
              </div>
            </div>
          )}
          {navigate && (
            <button onClick={() => navigate('/settings/subscription')} className="btn btn-outline btn-sm"
              style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}>
              Ver créditos por plano
            </button>
          )}
        </>
      )}
    </div>
  );
}

// Accept / reject pair used in every review queue.

"use client";

import { OnbTitle } from '@/features/onboarding/onb-title';
import { I } from '@/components/icons';

export function OnbStep2({ data, set }) {
  return (
    <>
      <OnbTitle title="Envie o logo da loja" desc="Usamos no painel, nos relatórios exportados e nas etiquetas de estoque. PNG ou SVG, fundo transparente de preferência." />
      {!data.logo ? (
        <div onClick={() => set('logo', true)} style={{
          border: '1.5px dashed var(--line-strong)',
          borderRadius: 10,
          padding: '44px 24px',
          textAlign: 'center',
          background: 'var(--bg-sunken)',
          cursor: 'pointer',
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 9, margin: '0 auto 14px',
            background: 'var(--bg-elev)', border: '1px solid var(--line)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-soft)',
          }}><I.Download size={18} style={{ transform: 'rotate(180deg)' }} /></div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>Arraste o arquivo aqui</div>
          <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 5 }}>
            ou <span style={{ color: 'var(--accent-text)', fontWeight: 500 }}>escolha do computador</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--fg-soft)', marginTop: 14, fontFamily: 'var(--font-mono)' }}>
            PNG · JPG · SVG · até 2 MB · mín. 256×256
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: 16, border: '1px solid var(--line)', borderRadius: 10, background: 'var(--bg-elev)' }}>
          <div className="placeholder-stripes" style={{ width: 76, height: 76, borderRadius: 8, border: '1px solid var(--line)', flexShrink: 0 }}>
            logo
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>logo-bonsucesso.svg</div>
            <div style={{ fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', marginTop: 3 }}>SVG · 18 KB · 512×512</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <button className="btn btn-outline btn-sm">Substituir</button>
              <button onClick={() => set('logo', false)} className="btn btn-ghost btn-sm">Remover</button>
            </div>
          </div>
          <span className="badge badge-success"><I.Check size={10} stroke={3} /> Válido</span>
        </div>
      )}
      <button onClick={() => set('logo', false)} className="btn btn-ghost btn-sm" style={{ marginTop: 14, color: 'var(--fg-muted)' }}>
        Não tenho logo agora — usar as iniciais
      </button>
    </>
  );
}

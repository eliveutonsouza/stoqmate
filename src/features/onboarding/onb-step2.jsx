"use client";

import { OnbTitle } from '@/features/onboarding/onb-title';
import { I } from '@/components/icons';

export function OnbStep2({ data, set }) {
  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    set('logoFile', file);
    set('logoPreviewUrl', URL.createObjectURL(file));
  };

  return (
    <>
      <OnbTitle title="Envie o logo da loja" desc="Usamos no painel, nos relatórios exportados e nas etiquetas de estoque. PNG com fundo transparente de preferência." />
      {!data.logoFile ? (
        <label style={{
          display: 'block',
          border: '1.5px dashed var(--line-strong)',
          borderRadius: 10,
          padding: '44px 24px',
          textAlign: 'center',
          background: 'var(--bg-sunken)',
          cursor: 'pointer',
        }}>
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onFileChange} style={{ display: 'none' }} />
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
            PNG · JPG · WEBP · até 2 MB · mín. 256×256
          </div>
        </label>
      ) : (
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: 16, border: '1px solid var(--line)', borderRadius: 10, background: 'var(--bg-elev)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={data.logoPreviewUrl} alt="Logo" style={{ width: 76, height: 76, borderRadius: 8, border: '1px solid var(--line)', objectFit: 'contain', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{data.logoFile.name}</div>
            <div style={{ fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', marginTop: 3 }}>{(data.logoFile.size / 1024).toFixed(0)} KB</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
                Substituir
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onFileChange} style={{ display: 'none' }} />
              </label>
              <button onClick={() => { set('logoFile', null); set('logoPreviewUrl', null); }} className="btn btn-ghost btn-sm">Remover</button>
            </div>
          </div>
          <span className="badge badge-success"><I.Check size={10} stroke={3} /> Válido</span>
        </div>
      )}
      <button onClick={() => { set('logoFile', null); set('logoPreviewUrl', null); }} className="btn btn-ghost btn-sm" style={{ marginTop: 14, color: 'var(--fg-muted)' }}>
        Não tenho logo agora — usar as iniciais
      </button>
    </>
  );
}

"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { SettingsLayout } from '@/components/ui/settings-layout';
import { FormCard } from '@/components/ui/form-card';
import { Field } from '@/components/ui/field';
import { ONB_COLORS } from '@/features/onboarding/onb-colors';
import { I } from '@/components/icons';
import { TextInput } from '@/components/ui/text-input';
import { updateBrandingAction, uploadBrandingLogoAction } from '@/features/settings/actions';

export function SettingsBranding({ branding }) {
  const navigate = useNavigate();
  const [color, setColor] = React.useState(branding.brandColor);
  const [logoFile, setLogoFile] = React.useState(null);
  const [logoPreview, setLogoPreview] = React.useState(branding.logoUrl);
  const [error, setError] = React.useState('');
  const [saved, setSaved] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const save = () => {
    setError(''); setSaved(false);
    startTransition(async () => {
      let logoUrl = branding.logoUrl;
      if (logoFile) {
        const formData = new FormData();
        formData.append('file', logoFile);
        const uploadResult = await uploadBrandingLogoAction(formData);
        if (uploadResult?.error) { setError(uploadResult.error); return; }
        logoUrl = uploadResult.url;
      }
      const result = await updateBrandingAction({ logoUrl, brandColor: color });
      if (result?.error) { setError(result.error); return; }
      setSaved(true);
    });
  };

  return (
    <StoreShell route="/settings/branding" breadcrumb={['Configurações', 'Branding']} navigate={navigate}>
      <PageHeader title="Configurações" sub="Identidade visual, dados da empresa, equipe e assinatura." />
      <SettingsLayout route="/settings/branding" navigate={navigate}>
        <FormCard title="Logo da loja" desc="Aparece no painel, nos relatórios exportados e nas etiquetas de estoque." cols={1}
          footer={<button onClick={save} disabled={pending} className="btn btn-primary">{pending ? 'Salvando…' : 'Salvar alterações'}</button>}>
          {logoPreview ? (
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoPreview} alt="" style={{ width: 84, height: 84, borderRadius: 8, border: '1px solid var(--line)', objectFit: 'contain', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{logoFile?.name ?? 'Logo atual'}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
                    Substituir
                    <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onFileChange} style={{ display: 'none' }} />
                  </label>
                  <button onClick={() => { setLogoFile(null); setLogoPreview(null); }} className="btn btn-ghost btn-sm">Remover</button>
                </div>
              </div>
            </div>
          ) : (
            <label style={{
              display: 'block', border: '1.5px dashed var(--line-strong)', borderRadius: 10,
              padding: '28px 24px', textAlign: 'center', background: 'var(--bg-sunken)', cursor: 'pointer',
            }}>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onFileChange} style={{ display: 'none' }} />
              <div style={{ fontSize: 13, fontWeight: 500 }}>Escolher logo</div>
              <div style={{ fontSize: 11, color: 'var(--fg-soft)', marginTop: 8, fontFamily: 'var(--font-mono)' }}>PNG · JPG · WEBP · até 2 MB</div>
            </label>
          )}
        </FormCard>

        <FormCard title="Cor principal" desc="Usada em destaques do painel." cols={1}
          footer={<button onClick={save} disabled={pending} className="btn btn-primary">{pending ? 'Salvando…' : 'Salvar alterações'}</button>}>
          <Field label="Cor da marca">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {ONB_COLORS.map(c => {
                const active = color.toLowerCase() === c.toLowerCase();
                return (
                  <button key={c} onClick={() => setColor(c)} style={{
                    width: 34, height: 34, borderRadius: 7, background: c,
                    border: '2px solid transparent',
                    boxShadow: active ? '0 0 0 2px var(--bg-elev), 0 0 0 4px var(--fg)' : 'var(--shadow-xs)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                  }}>{active && <I.Check size={14} stroke={3} />}</button>
                );
              })}
            </div>
          </Field>
          <Field label="Hexadecimal">
            <TextInput mono value={color.toUpperCase()} onChange={(e) => setColor(e.target.value)} style={{ width: 130 }} />
          </Field>
          {error && <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 10 }}>{error}</div>}
          {saved && <div style={{ fontSize: 12, color: 'var(--success)', marginTop: 10 }}>Branding atualizado.</div>}
        </FormCard>

        <FormCard title="Pré-visualização" desc="Como o painel fica com esta cor." cols={1}>
          <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '11px 14px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-sunken)' }}>
              <div style={{ width: 20, height: 20, borderRadius: 5, background: color }}></div>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{branding.name}</span>
              <div style={{ flex: 1 }}></div>
              <div style={{ background: `color-mix(in srgb, ${color} 84%, #000)`, color: '#fff', padding: '4px 10px', borderRadius: 5, fontSize: 11, fontWeight: 500 }}>Nova venda</div>
            </div>
            <div style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'flex-end', height: 90 }}>
              {[52, 68, 44, 80, 62, 92, 74].map((h, i) => (
                <div key={i} style={{ flex: 1, height: `${h}%`, background: i === 5 ? color : `color-mix(in srgb, ${color} 22%, transparent)`, borderRadius: '3px 3px 0 0' }}></div>
              ))}
            </div>
          </div>
        </FormCard>
      </SettingsLayout>
    </StoreShell>
  );
}

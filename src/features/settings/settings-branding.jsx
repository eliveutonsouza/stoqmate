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

export function SettingsBranding() {
  const navigate = useNavigate();
  const [color, setColor] = React.useState('#E94B1C');
  const [logo, setLogo] = React.useState(true);
  return (
    <StoreShell route="/settings/branding" breadcrumb={['Configurações', 'Branding']} navigate={navigate}>
      <PageHeader title="Configurações" sub="Identidade visual, dados da empresa, equipe e assinatura." />
      <SettingsLayout route="/settings/branding" navigate={navigate}>
        <FormCard title="Logo da loja" desc="Aparece no painel, nos relatórios exportados e nas etiquetas de estoque." cols={1}
          footer={<><button className="btn btn-ghost">Descartar</button><button className="btn btn-primary">Salvar alterações</button></>}>
          {logo ? (
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div className="placeholder-stripes" style={{ width: 84, height: 84, borderRadius: 8, border: '1px solid var(--line)', flexShrink: 0 }}>logo</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>logo-bonsucesso.svg</div>
                <div style={{ fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', marginTop: 3 }}>SVG · 18 KB · 512×512</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  <button className="btn btn-outline btn-sm">Substituir</button>
                  <button onClick={() => setLogo(false)} className="btn btn-ghost btn-sm">Remover</button>
                </div>
              </div>
            </div>
          ) : (
            <div onClick={() => setLogo(true)} style={{
              border: '1.5px dashed var(--line-strong)', borderRadius: 10,
              padding: '28px 24px', textAlign: 'center', background: 'var(--bg-sunken)', cursor: 'pointer',
            }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Arraste o logo aqui</div>
              <div style={{ fontSize: 11, color: 'var(--fg-soft)', marginTop: 8, fontFamily: 'var(--font-mono)' }}>PNG · SVG · até 2 MB</div>
            </div>
          )}
        </FormCard>

        <FormCard title="Cor principal" desc="Os tons secundários para tema claro e escuro são gerados automaticamente." cols={1}
          footer={<><button className="btn btn-ghost">Descartar</button><button className="btn btn-primary">Salvar alterações</button></>}>
          <Field label="Cor da marca">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {ONB_COLORS.map(c => {
                const active = color === c;
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
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 9 }}>Tons gerados</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[8, 16, 32, 60, 100].map(p => (
                <div key={p} style={{ flex: 1 }}>
                  <div style={{ height: 34, borderRadius: 6, background: `color-mix(in srgb, ${color} ${p}%, var(--bg-elev))`, border: '1px solid var(--line)' }}></div>
                  <div style={{ fontSize: 10, color: 'var(--fg-soft)', fontFamily: 'var(--font-mono)', textAlign: 'center', marginTop: 4 }}>{p}%</div>
                </div>
              ))}
            </div>
          </div>
        </FormCard>

        <FormCard title="Pré-visualização" desc="Como o painel fica com esta cor." cols={1}>
          <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '11px 14px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-sunken)' }}>
              <div style={{ width: 20, height: 20, borderRadius: 5, background: color }}></div>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Bonsucesso Varejo</span>
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

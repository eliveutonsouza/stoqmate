"use client";

import { OnbTitle } from '@/features/onboarding/onb-title';
import { Field } from '@/components/ui/field';
import { ONB_COLORS } from '@/features/onboarding/onb-colors';
import { I } from '@/components/icons';
import { TextInput } from '@/components/ui/text-input';

export function OnbStep3({ data, set }) {
  return (
    <>
      <OnbTitle title="Escolha a cor da sua marca" desc="Ela pinta botões, gráficos e destaques do painel. Geramos automaticamente os tons secundários para tema claro e escuro." />
      <Field label="Cor principal">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {ONB_COLORS.map(c => {
            const active = data.color === c;
            return (
              <button key={c} onClick={() => set('color', c)} style={{
                width: 38, height: 38, borderRadius: 8,
                background: c,
                border: '2px solid ' + (active ? 'var(--fg)' : 'transparent'),
                boxShadow: active ? '0 0 0 2px var(--bg), 0 0 0 4px var(--fg)' : 'var(--shadow-xs)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff',
              }}>{active && <I.Check size={15} stroke={3} />}</button>
            );
          })}
        </div>
      </Field>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginTop: 14 }}>
        <Field label="Código hexadecimal">
          <TextInput mono value={data.color.toUpperCase()} onChange={(e) => set('color', e.target.value)} style={{ width: 130, height: 34 }} />
        </Field>
      </div>

      {/* Live preview */}
      <div style={{ marginTop: 26 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 10 }}>Pré-visualização</div>
        <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden', background: 'var(--bg-elev)' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: data.color }}></div>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{data.name || 'Sua loja'}</span>
            <div style={{ flex: 1 }}></div>
            <div style={{ background: `color-mix(in srgb, ${data.color} 84%, #000)`, color: '#fff', padding: '4px 10px', borderRadius: 5, fontSize: 11, fontWeight: 500 }}>Nova venda</div>
          </div>
          <div style={{ padding: 16, display: 'flex', gap: 14, alignItems: 'flex-end' }}>
            {[52, 68, 44, 80, 62, 92, 74].map((h, i) => (
              <div key={i} style={{ flex: 1, height: h, background: i === 5 ? data.color : `color-mix(in srgb, ${data.color} 22%, transparent)`, borderRadius: '3px 3px 0 0' }}></div>
            ))}
          </div>
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--line)', display: 'flex', gap: 8 }}>
            <span style={{ background: `color-mix(in srgb, ${data.color} 12%, transparent)`, color: data.color, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500 }}>
              Em estoque
            </span>
            <span className="badge badge-warning">Crítico</span>
            <span className="badge badge-success">Sincronizado</span>
          </div>
        </div>
      </div>
    </>
  );
}

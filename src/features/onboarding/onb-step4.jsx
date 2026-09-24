"use client";

import { OnbTitle } from '@/features/onboarding/onb-title';
import { MOCK, catById } from '@/lib/mock';
import { I } from '@/components/icons';

export function OnbStep4({ data, set }) {
  const toggle = (id) => set('cats', data.cats.includes(id) ? data.cats.filter(c => c !== id) : [...data.cats, id]);
  return (
    <>
      <OnbTitle
        title="O que você vende?"
        desc="Cada categoria vem com um esquema de atributos e uma unidade de medida pré-configurados. Dá para editar tudo depois — e criar categorias do zero."
      />
      <div className="g2" style={{ gap: 8 }}>
        {MOCK.categories.map(c => {
          const on = data.cats.includes(c.id);
          const CIco = I[c.icon] || I.Box;
          return (
            <button key={c.id} onClick={() => toggle(c.id)} style={{
              display: 'flex', gap: 11, alignItems: 'flex-start', textAlign: 'left',
              padding: '12px 14px',
              border: '1px solid ' + (on ? 'var(--accent)' : 'var(--line)'),
              background: on ? 'var(--accent-soft)' : 'var(--bg-elev)',
              borderRadius: 8, width: '100%',
            }}>
              <span style={{
                width: 16, height: 16, borderRadius: 4, flexShrink: 0, marginTop: 1,
                border: '1px solid ' + (on ? 'var(--accent)' : 'var(--line-strong)'),
                background: on ? 'var(--accent-strong)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
              }}>{on && <I.Check size={10} stroke={3} />}</span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ color: c.cssInk, display: 'flex' }}><CIco size={14} /></span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)' }}>{c.name}</span>
                </span>
                <span style={{ display: 'block', fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 4 }}>
                  {c.attributes.map(a => a.label).join(' · ')}
                </span>
                <span style={{ display: 'block', fontSize: 10.5, color: 'var(--fg-muted)', marginTop: 3, fontFamily: 'var(--font-mono)' }}>
                  un: {c.unit} · SKU: {c.code}-…
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <button style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        marginTop: 8, padding: '12px 14px',
        border: '1.5px dashed var(--line-strong)', background: 'var(--bg-sunken)',
        borderRadius: 8, textAlign: 'left', color: 'var(--fg)',
      }}>
        <span style={{ color: 'var(--accent-text)', display: 'flex' }}><I.Plus size={15} /></span>
        <span style={{ flex: 1 }}>
          <span style={{ display: 'block', fontSize: 13, fontWeight: 500 }}>Criar uma categoria do zero</span>
          <span style={{ display: 'block', fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 2 }}>
            Autopeças, farmácia, material de construção — você define os atributos.
          </span>
        </span>
      </button>

      <div style={{
        marginTop: 16, padding: '11px 13px',
        background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 8,
        fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.5,
      }}>
        {data.cats.length === 0
          ? 'Selecione ao menos uma categoria para continuar.'
          : <>Selecionadas <strong style={{ color: 'var(--fg)', fontWeight: 500 }}>{data.cats.length}</strong> categorias, com{' '}
            <strong style={{ color: 'var(--fg)', fontWeight: 500 }}>
              {data.cats.reduce((s, id) => s + catById(id).attributes.length, 0)} atributos
            </strong> no total.</>}
      </div>
    </>
  );
}

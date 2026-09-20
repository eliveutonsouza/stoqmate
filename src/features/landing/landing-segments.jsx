"use client";

import { SECTION } from '@/features/landing/section';
import { Eyebrow } from '@/features/landing/eyebrow';
import { H2 } from '@/features/landing/h2';
import { Lead } from '@/features/landing/lead';
import { I } from '@/components/icons';

export function LandingSegments() {
  const segs = [
    { icon: 'Shirt', name: 'Vestuário', attrs: 'Cor · Tamanho', unit: 'peça' },
    { icon: 'Box', name: 'Calçados', attrs: 'Cor · Numeração', unit: 'par' },
    { icon: 'Zap', name: 'Eletrônicos', attrs: 'Cor · Capacidade', unit: 'unidade' },
    { icon: 'Coffee', name: 'Alimentos', attrs: 'Sabor · Peso', unit: 'kg' },
    { icon: 'Home', name: 'Casa e decoração', attrs: 'Cor · Material', unit: 'unidade' },
    { icon: 'Book', name: 'Papelaria', attrs: 'Cor · Formato', unit: 'caixa' },
    { icon: 'Settings', name: 'Autopeças', attrs: 'Montadora · Código OEM', unit: 'unidade' },
    { icon: 'Sliders', name: 'O seu ramo', attrs: 'atributos que você criar', unit: 'à sua escolha', custom: true },
  ];
  return (
    <section style={{ ...SECTION, paddingBottom: 80 }}>
      <div style={{ textAlign: 'center' }}>
        <Eyebrow>Qualquer categoria de produto</Eyebrow>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <H2 max={680}>Não é um sistema de nicho com o seu nome trocado.</H2>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Lead max={580}>
            Cada categoria traz os próprios atributos e a própria unidade de medida. Comece por um modelo pronto do seu ramo
            ou monte o esquema do zero em dois minutos.
          </Lead>
        </div>
      </div>

      <div className="lp-g4" style={{ gap: 12, marginTop: 36 }}>
        {segs.map(s => {
          const Ico = I[s.icon] || I.Box;
          return (
            <div key={s.name} style={{
              border: '1px solid ' + (s.custom ? 'var(--accent)' : 'var(--line)'),
              borderStyle: s.custom ? 'dashed' : 'solid',
              background: s.custom ? 'var(--accent-soft)' : 'var(--bg-elev)',
              borderRadius: 10, padding: 16,
            }}>
              <span style={{ color: s.custom ? 'var(--accent-text)' : 'var(--fg-muted)', display: 'flex' }}><Ico size={17} /></span>
              <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 12, letterSpacing: '-0.012em' }}>{s.name}</div>
              <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 4, lineHeight: 1.45 }}>{s.attrs}</div>
              <div style={{ fontSize: 10.5, color: 'var(--fg-muted)', marginTop: 8, fontFamily: 'var(--font-mono)' }}>un: {s.unit}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// === 5 · FEATURES with real screens ===

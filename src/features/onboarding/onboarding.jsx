"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { OnboardingComplete } from '@/features/onboarding/onboarding-complete';
import { I } from '@/components/icons';
import { OnbStep1 } from '@/features/onboarding/onb-step1';
import { OnbStep2 } from '@/features/onboarding/onb-step2';
import { OnbStep3 } from '@/features/onboarding/onb-step3';
import { OnbStep4 } from '@/features/onboarding/onb-step4';
import { OnbStepFiscal } from '@/features/onboarding/onb-step-fiscal';
import { OnbStep5 } from '@/features/onboarding/onb-step5';

export function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = React.useState(1);
  const [data, setData] = React.useState({
    name: '', logo: false, color: '#E94B1C',
    cats: ['vestuario', 'eletronicos'],
  });
  const set = (k, v) => setData(d => ({ ...d, [k]: v }));
  const [done, setDone] = React.useState(false);

  const steps = [
    { n: 1, label: 'Nome da loja' },
    { n: 2, label: 'Logo' },
    { n: 3, label: 'Cor principal' },
    { n: 4, label: 'O que você vende' },
    { n: 5, label: 'Emissão fiscal' },
    { n: 6, label: 'Revisão' },
  ];

  const canAdvance = step === 1 ? data.name.trim().length >= 3 : step === 4 ? data.cats.length > 0 : true;

  if (done) return <OnboardingComplete navigate={navigate} data={data} />;

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '272px minmax(0, 1fr)', background: 'var(--bg)', color: 'var(--fg)' }}>
      {/* Step rail */}
      <aside style={{ background: 'var(--bg-sunken)', borderRight: '1px solid var(--line)', padding: '28px 24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 36 }}>
          <I.Brand size={22} />
          <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.018em' }}>Stoqmate</span>
        </div>

        <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--fg-soft)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
          Configuração inicial
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {steps.map((s, i) => {
            const state = s.n < step ? 'done' : s.n === step ? 'current' : 'todo';
            return (
              <div key={s.n} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)',
                    background: state === 'done' ? 'var(--accent)' : state === 'current' ? 'var(--bg-elev)' : 'transparent',
                    color: state === 'done' ? '#fff' : state === 'current' ? 'var(--fg)' : 'var(--fg-soft)',
                    border: '1px solid ' + (state === 'todo' ? 'var(--line-strong)' : state === 'current' ? 'var(--accent)' : 'var(--accent)'),
                    boxShadow: state === 'current' ? '0 0 0 3px var(--accent-soft)' : 'none',
                  }}>
                    {state === 'done' ? <I.Check size={11} stroke={3} /> : s.n}
                  </div>
                  {i < steps.length - 1 && (
                    <div style={{ width: 1, height: 26, background: s.n < step ? 'var(--accent)' : 'var(--line)' }}></div>
                  )}
                </div>
                <button onClick={() => s.n < step && setStep(s.n)} style={{
                  background: 'none', border: 'none', padding: '2px 0 0', textAlign: 'left',
                  fontSize: 13, fontWeight: state === 'current' ? 500 : 400,
                  color: state === 'todo' ? 'var(--fg-soft)' : 'var(--fg)',
                  cursor: s.n < step ? 'pointer' : 'default',
                  fontFamily: 'inherit',
                }}>{s.label}</button>
              </div>
            );
          })}
        </div>

        <div style={{ flex: 1 }}></div>
        <div style={{ fontSize: 11, color: 'var(--fg-soft)', lineHeight: 1.55 }}>
          Precisa de ajuda? Fale com o time no chat ou em <span style={{ color: 'var(--fg-muted)' }}>suporte@stoqmate.com.br</span>.
        </div>
      </aside>

      {/* Step content */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center', padding: '56px 40px' }}>
          <div style={{ width: '100%', maxWidth: 560 }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent-text)', marginBottom: 10 }}>
              PASSO {step} DE {steps.length}
            </div>

            {step === 1 && <OnbStep1 data={data} set={set} />}
            {step === 2 && <OnbStep2 data={data} set={set} />}
            {step === 3 && <OnbStep3 data={data} set={set} />}
            {step === 4 && <OnbStep4 data={data} set={set} />}
            {step === 5 && <OnbStepFiscal data={data} set={set} />}
            {step === 6 && <OnbStep5 data={data} goTo={setStep} />}
          </div>
        </div>

        {/* Footer nav */}
        <div style={{
          borderTop: '1px solid var(--line)', padding: '14px 40px',
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--bg)',
        }}>
          <button onClick={() => step > 1 ? setStep(step - 1) : navigate('/signup')} className="btn btn-ghost">
            <I.ChevronLeft size={13} /> Voltar
          </button>
          <div style={{ flex: 1 }}></div>
          {(step === 4 || step === 5) && <button onClick={() => setStep(step + 1)} className="btn btn-ghost">Configurar depois</button>}
          {step < 6 ? (
            <button onClick={() => canAdvance && setStep(step + 1)} className="btn btn-primary btn-lg" disabled={!canAdvance}
              style={{ opacity: canAdvance ? 1 : 0.45, cursor: canAdvance ? 'pointer' : 'not-allowed' }}>
              Continuar <I.ArrowRight size={13} />
            </button>
          ) : (
            <button onClick={() => setDone(true)} className="btn btn-primary btn-lg">
              Concluir e entrar <I.Check size={14} stroke={2.4} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

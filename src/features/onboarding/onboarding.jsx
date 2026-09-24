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
import { completeOnboardingAction, uploadStoreLogoAction } from '@/features/onboarding/actions';

export function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = React.useState(1);
  const [data, setData] = React.useState({
    name: '', logoFile: null, logoPreviewUrl: null, color: '#E94B1C',
    cats: ['vestuario', 'eletronicos'], fiscal: 'later',
  });
  const set = (k, v) => setData(d => ({ ...d, [k]: v }));
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState('');
  const [pending, startTransition] = React.useTransition();

  const steps = [
    { n: 1, label: 'Nome da loja' },
    { n: 2, label: 'Logo' },
    { n: 3, label: 'Cor principal' },
    { n: 4, label: 'O que você vende' },
    { n: 5, label: 'Emissão fiscal' },
    { n: 6, label: 'Revisão' },
  ];

  const canAdvance = step === 1 ? data.name.trim().length >= 3 : step === 4 ? data.cats.length > 0 : true;

  const finish = () => {
    setError('');
    startTransition(async () => {
      let logoUrl = null;
      if (data.logoFile) {
        const formData = new FormData();
        formData.append('file', data.logoFile);
        const uploadResult = await uploadStoreLogoAction(formData);
        if (uploadResult?.error) { setError(uploadResult.error); return; }
        logoUrl = uploadResult.url;
      }
      const result = await completeOnboardingAction({
        storeName: data.name, logoUrl, brandColor: data.color,
        categoryIds: data.cats, fiscalMode: data.fiscal,
      });
      if (result?.error) { setError(result.error); return; }
      setDone(true);
    });
  };

  if (done) return <OnboardingComplete navigate={navigate} data={data} />;

  return (
    <div className="split-nav" style={{ '--nav': '272px', gap: 0, alignItems: 'stretch', minHeight: '100vh', background: 'var(--bg)', color: 'var(--fg)' }}>
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
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center', padding: 'clamp(24px, 6vw, 56px) var(--page-pad)' }}>
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
          {error && (
            <div style={{ position: 'absolute', transform: 'translateY(-56px)', padding: '9px 13px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 7, fontSize: 12.5 }}>
              {error}
            </div>
          )}
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
            <button onClick={finish} className="btn btn-primary btn-lg" disabled={pending}>
              {pending ? 'Concluindo…' : 'Concluir e entrar'} <I.Check size={14} stroke={2.4} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

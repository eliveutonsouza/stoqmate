"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { CANCEL_REASONS } from '@/features/billing/cancel-reasons';
import { SUB, subPlan } from '@/features/billing/billing-state';
import { PLANS, annualSavings } from '@/lib/plans';
import { brl } from '@/lib/format';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Page } from '@/components/ui/page-container';
import { I } from '@/components/icons';
import { Field } from '@/components/ui/field';
import { TextareaInput } from '@/components/ui/textarea-input';
import { TextInput } from '@/components/ui/text-input';

export function CancelSubscription() {
  const navigate = useNavigate();
  const [step, setStep] = React.useState(1);
  const [reason, setReason] = React.useState(null);
  const [detail, setDetail] = React.useState('');
  const [confirmText, setConfirmText] = React.useState('');
  const r = CANCEL_REASONS.find(x => x.id === reason);
  const cur = subPlan();
  const cheaper = PLANS[0];

  const OFFERS = {
    annual: {
      t: `No anual você paga ${brl(annualSavings(cur, SUB.units).yearly)} e economiza ${brl(annualSavings(cur, SUB.units).save)} por ano`,
      d: `São dois meses grátis, preço travado por 12 meses e os créditos de IA passam a acumular de um mês para o outro. Se o problema for o valor mensal, este é o corte mais rápido — sem perder nenhum recurso.`,
      cta: 'Ver o plano anual', route: '/settings/subscription/annual',
      alt: 'Prefiro descer para o Balcão', altRoute: '/settings/subscription/change',
    },
    downgrade: {
      t: `Descer para o ${cheaper.name} custa ${brl(cheaper.monthly * SUB.units)}/mês`,
      d: `Você economiza ${brl((cur.monthly - cheaper.monthly) * SUB.units)} por mês e mantém catálogo, balcão, caixa e histórico. Perde transferência entre lojas e parte da IA.`,
      cta: 'Descer de plano em vez de cancelar', route: '/settings/subscription/change',
    },
    onboarding: {
      t: 'Trinta minutos com alguém do time, sem custo',
      d: 'A maioria de quem para de usar travou em um ponto só — geralmente a importação do catálogo ou a contagem de inventário. Marcamos uma call e deixamos rodando.',
      cta: 'Agendar ajuda gratuita', route: '/help',
    },
    feature: {
      t: 'Conta pra gente o que falta',
      d: 'Se já estiver no roteiro, dizemos a data. Se não estiver, você recebe dois meses de crédito caso a gente entregue em até 90 dias.',
      cta: 'Enviar e falar com o time', route: '/help',
    },
    pause: {
      t: 'Pausar por até 3 meses em vez de cancelar',
      d: 'A cobrança para, os dados ficam congelados e você volta exatamente de onde parou — sem recadastrar nada.',
      cta: 'Pausar assinatura', route: '/settings/subscription',
    },
  };
  const offer = r ? OFFERS[r.offer] : null;

  return (
    <StoreShell route="/settings/subscription" breadcrumb={['Configurações', 'Assinatura', 'Cancelar']} navigate={navigate}>
      <PageHeader title="Cancelar assinatura" sub={`${cur.name} · ${SUB.units} lojas · próxima cobrança em ${SUB.nextCharge}`} />
      <Page width={720}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
          {['Motivo', 'Alternativa', 'Confirmação'].map((s, i) => (
            <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ height: 3, borderRadius: 2, background: step > i ? 'var(--accent-strong)' : 'var(--bg-sunken)' }}></div>
              <span style={{ fontSize: 11.5, color: step > i ? 'var(--fg)' : 'var(--fg-muted)', fontWeight: step === i + 1 ? 600 : 400 }}>{i + 1}. {s}</span>
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, letterSpacing: '-0.02em' }}>Por que você está cancelando?</h3>
            <p style={{ margin: '6px 0 16px', fontSize: 13, color: 'var(--fg-muted)' }}>Uma resposta só. Serve para a gente consertar o que está quebrado — e, se der, resolver o seu caso agora.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {CANCEL_REASONS.map(o => (
                <button key={o.id} onClick={() => setReason(o.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 11, textAlign: 'left', width: '100%', padding: '11px 13px', borderRadius: 7,
                  border: '1px solid ' + (reason === o.id ? 'var(--accent)' : 'var(--line)'),
                  background: reason === o.id ? 'var(--accent-soft)' : 'var(--bg-elev)',
                }}>
                  <span style={{
                    width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                    border: '1px solid ' + (reason === o.id ? 'var(--accent)' : 'var(--line-strong)'),
                    background: reason === o.id ? 'var(--accent-strong)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                  }}>{reason === o.id && <I.Check size={9} stroke={3} />}</span>
                  <span style={{ fontSize: 13, color: 'var(--fg)' }}>{o.l}</span>
                </button>
              ))}
            </div>
            <div style={{ marginTop: 14 }}>
              <Field label="Quer detalhar?" hint="Opcional. Vai direto para o time de produto.">
                <TextareaInput value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Ex.: a contagem de inventário trava quando tenho dois funcionários contando ao mesmo tempo." />
              </Field>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18 }}>
              <button onClick={() => navigate('/settings/subscription')} className="btn btn-ghost">Voltar</button>
              <button disabled={!reason} onClick={() => setStep(2)} className="btn btn-primary" style={{ opacity: reason ? 1 : 0.5 }}>Continuar</button>
            </div>
          </div>
        )}

        {step === 2 && offer && (
          <>
            <div className="card" style={{ padding: 20, borderColor: 'var(--accent)' }}>
              <span className="badge badge-accent" style={{ marginBottom: 12 }}><I.Sparkle size={11} /> Uma alternativa antes de ir</span>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, letterSpacing: '-0.02em' }}>{offer.t}</h3>
              <p style={{ margin: '8px 0 0', fontSize: 13.5, color: 'var(--fg-muted)', lineHeight: 1.6 }}>{offer.d}</p>
              <button onClick={() => navigate(offer.route)} className="btn btn-primary" style={{ marginTop: 16 }}>{offer.cta}</button>
              {offer.alt && <button onClick={() => navigate(offer.altRoute)} className="btn btn-ghost" style={{ marginTop: 16, marginLeft: 8 }}>{offer.alt}</button>}
            </div>
            <div className="card" style={{ padding: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 10 }}>O que você perde ao cancelar</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  ['Histórico de movimentação', '24 meses de entradas, vendas e ajustes.'],
                  ['Previsão e reposição', 'A sugestão de compra semanal para de rodar.'],
                  ['Balcão e caixa', 'A loja volta a registrar venda fora do sistema.'],
                  ['Equipe', '6 usuários perdem o acesso em 01 de outubro.'],
                ].map(([t, d]) => (
                  <div key={t} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--danger)', display: 'flex', marginTop: 2 }}><I.X size={13} /></span>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 500 }}>{t}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 1, lineHeight: 1.45 }}>{d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep(1)} className="btn btn-ghost">Voltar</button>
              <button onClick={() => setStep(3)} className="btn btn-outline">Quero cancelar mesmo assim</button>
            </div>
          </>
        )}

        {step === 3 && (
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, letterSpacing: '-0.02em' }}>Confirmar cancelamento</h3>
            <p style={{ margin: '6px 0 16px', fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.6 }}>
              Sem multa e sem ligação. Você fica com o acesso completo até <strong style={{ color: 'var(--fg)' }}>{SUB.nextCharge}</strong>, porque o mês já está pago.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 16 }}>
              {[
                ['01 out 2026', 'A cobrança para. Nenhum valor novo é lançado no cartão.'],
                ['01 out 2026', 'A conta vira somente leitura: você consulta e exporta, mas não registra movimentação.'],
                ['30 dez 2026', 'Fim dos 90 dias de exportação. Depois disso os dados são apagados em definitivo.'],
              ].map(([d, t], i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)', width: 84, flexShrink: 0, marginTop: 1 }}>{d}</span>
                  <span style={{ fontSize: 12.5, color: 'var(--fg)', lineHeight: 1.5 }}>{t}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: '12px 14px', border: '1px solid var(--warning)', borderRadius: 8, marginBottom: 16, display: 'flex', gap: 11, alignItems: 'center' }}>
              <span style={{ color: 'var(--warning)', display: 'flex' }}><I.Download size={15} /></span>
              <div style={{ flex: 1, fontSize: 12.5, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
                Leve seus dados agora: catálogo, estoque, movimentações e clientes em XLSX e CSV.
              </div>
              <button onClick={() => navigate('/exports')} className="btn btn-outline btn-sm">Exportar tudo</button>
            </div>
            <Field label="Digite CANCELAR para confirmar" required>
              <TextInput mono value={confirmText} onChange={(e) => setConfirmText(e.target.value.toUpperCase())} placeholder="CANCELAR" />
            </Field>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18 }}>
              <button onClick={() => setStep(2)} className="btn btn-ghost">Voltar</button>
              <button disabled={confirmText !== 'CANCELAR'} onClick={() => navigate('/account/cancelled')} className="btn btn-danger" style={{ opacity: confirmText === 'CANCELAR' ? 1 : 0.5 }}>
                Cancelar assinatura
              </button>
            </div>
          </div>
        )}
      </Page>
    </StoreShell>
  );
}

// === /account/cancelled — conta em somente leitura, com porta de volta ===

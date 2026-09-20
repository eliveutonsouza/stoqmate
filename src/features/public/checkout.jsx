"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { PLANS } from '@/lib/plans';
import { LayoutPublic } from '@/components/layout/layout-public';
import { I } from '@/components/icons';
import { FormCard } from '@/components/ui/form-card';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { brl } from '@/lib/format';
import { SummaryRow } from '@/components/ui/summary-row';

export function Checkout() {
  const navigate = useNavigate();
  const [plan, setPlan] = React.useState('controle');
  const [cycle, setCycle] = React.useState('monthly');
  const [units, setUnits] = React.useState(1);
  const [method, setMethod] = React.useState('card');

  const chosen = PLANS.find(p => p.id === plan);
  const base = chosen.monthly;
  const monthly = base * units;
  const yearly = chosen.yearly * units;
  const charged = cycle === 'monthly' ? monthly : yearly;
  const saving = monthly * 12 - yearly;

  return (
    <LayoutPublic navigate={navigate} route="/checkout">
      <section style={{ maxWidth: 1020, margin: '0 auto', padding: '52px 32px 72px' }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--fg-muted)', marginBottom: 12 }}>
            <span>Conta criada</span>
            <I.ChevronRight size={12} />
            <span style={{ color: 'var(--fg)', fontWeight: 500 }}>Pagamento</span>
            <I.ChevronRight size={12} />
            <span>Configuração inicial</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 34, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Confirmar assinatura
          </h1>
          <p style={{ margin: '12px 0 0', fontSize: 15, color: 'var(--fg-muted)', maxWidth: 520, lineHeight: 1.55 }}>
            Nenhuma cobrança hoje. Pedimos o cartão para que o acesso continue sem interrupção quando o teste de 30 dias terminar.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 32, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FormCard title="Plano e unidades" cols={1}>
              <Field label="Plano">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {PLANS.map(o => {
                    const on = plan === o.id;
                    return (
                      <button key={o.id} onClick={() => setPlan(o.id)} style={{
                        display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'left',
                        padding: '11px 13px',
                        border: '1px solid ' + (on ? 'var(--accent)' : 'var(--line)'),
                        background: on ? 'var(--accent-soft)' : 'var(--bg-elev)',
                        borderRadius: 7,
                      }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg)' }}>{o.name}</span>
                        <span style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--fg)', letterSpacing: '-0.02em' }}>R$ {o.monthly}</span>
                        <span style={{ fontSize: 10.5, color: 'var(--fg-muted)', lineHeight: 1.4 }}>{o.who}</span>
                        <span style={{ fontSize: 10.5, color: 'var(--accent-text)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}><I.Sparkle size={10} /> {o.credits.toLocaleString('pt-BR')} créditos</span>
                      </button>
                    );
                  })}
                </div>
              </Field>
              <Field label="Quantas unidades você vai cadastrar?" hint="A cobrança é por loja ativa. Você pode adicionar mais depois.">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => setUnits(u => Math.max(1, u - 1))} className="btn btn-outline btn-icon">−</button>
                  <TextInput mono type="number" value={units} onChange={(e) => setUnits(Math.max(1, +e.target.value || 1))} style={{ width: 80, textAlign: 'center' }} />
                  <button onClick={() => setUnits(u => u + 1)} className="btn btn-outline btn-icon">+</button>
                  <span style={{ fontSize: 12, color: 'var(--fg-muted)', marginLeft: 6 }}>
                    {units === 1 ? 'loja' : 'lojas'} × {brl(base)}
                  </span>
                </div>
              </Field>
              <Field label="Ciclo de cobrança">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {[
                    { k: 'monthly', t: 'Mensal', d: `${brl(monthly)} por mês, cancele quando quiser.` },
                    { k: 'yearly', t: 'Anual', d: `${brl(yearly)} por ano — economize ${brl(saving)} (2 meses grátis).` },
                  ].map(o => (
                    <button key={o.k} onClick={() => setCycle(o.k)} style={{
                      display: 'flex', gap: 11, alignItems: 'flex-start', textAlign: 'left',
                      padding: '11px 13px',
                      border: '1px solid ' + (cycle === o.k ? 'var(--accent)' : 'var(--line)'),
                      background: cycle === o.k ? 'var(--accent-soft)' : 'var(--bg-elev)',
                      borderRadius: 7, width: '100%',
                    }}>
                      <span style={{
                        width: 14, height: 14, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                        border: '1px solid ' + (cycle === o.k ? 'var(--accent)' : 'var(--line-strong)'),
                        background: cycle === o.k ? 'var(--accent-strong)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                      }}>{cycle === o.k && <I.Check size={9} stroke={3} />}</span>
                      <span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)' }}>{o.t}</span>
                          {o.k === 'yearly' && <span className="badge badge-success">2 meses grátis</span>}
                        </span>
                        <span style={{ display: 'block', fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>{o.d}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </Field>
            </FormCard>

            <FormCard title="Forma de pagamento" cols={1}>
              <div style={{ display: 'flex', gap: 2, padding: 3, background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 7 }}>
                {[{ k: 'card', l: 'Cartão de crédito' }, { k: 'boleto', l: 'Boleto' }, { k: 'pix', l: 'PIX' }].map(o => (
                  <button key={o.k} onClick={() => setMethod(o.k)} style={{
                    flex: 1, background: method === o.k ? 'var(--bg-elev)' : 'transparent',
                    border: '1px solid ' + (method === o.k ? 'var(--line)' : 'transparent'),
                    borderRadius: 5, padding: '6px 10px', fontSize: 12.5, fontWeight: 500,
                    color: method === o.k ? 'var(--fg)' : 'var(--fg-muted)',
                  }}>{o.l}</button>
                ))}
              </div>

              {method === 'card' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Field label="Número do cartão" required span={2}>
                    <TextInput mono placeholder="0000 0000 0000 0000" suffix="VISA" />
                  </Field>
                  <Field label="Nome impresso" required span={2}>
                    <TextInput placeholder="MARIANA S SOUZA" />
                  </Field>
                  <Field label="Validade" required span={1}><TextInput mono placeholder="MM/AA" /></Field>
                  <Field label="CVV" required span={1}><TextInput mono placeholder="000" /></Field>
                </div>
              )}
              {method === 'boleto' && (
                <div style={{ padding: '12px 14px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 7, fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.55 }}>
                  O boleto da primeira cobrança é enviado por email ao fim do teste, com 5 dias de prazo.
                  Só disponível no ciclo anual.
                </div>
              )}
              {method === 'pix' && (
                <div style={{ padding: '12px 14px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 7, fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.55 }}>
                  Enviamos o QR Code por email ao fim do teste. O acesso é liberado na confirmação, em segundos.
                </div>
              )}

              <Field label="CNPJ para a nota fiscal" required>
                <TextInput mono defaultValue="24.531.908/0001-72" />
              </Field>
            </FormCard>
          </div>

          <div style={{ position: 'sticky', top: 80, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ padding: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 12 }}>Resumo</div>
              <SummaryRow label={`Plano ${chosen.name} · ${units} ${units === 1 ? 'loja' : 'lojas'}`} value={brl(cycle === 'monthly' ? monthly : yearly)} />
              <SummaryRow label="Créditos de IA por mês" value={(chosen.credits * units).toLocaleString('pt-BR')} />
              <SummaryRow label={cycle === 'monthly' ? 'Cobrança mensal' : 'Cobrança anual'} value={cycle === 'monthly' ? 'a cada 30 dias' : 'a cada 12 meses'} />
              {cycle === 'yearly' && <SummaryRow label="Desconto anual" value={'− ' + brl(saving)} tone="success" />}
              <SummaryRow label="Teste de 30 dias" value={'− ' + brl(charged)} tone="success" />
              <div style={{ borderTop: '1px solid var(--line)', marginTop: 8, paddingTop: 8 }}>
                <SummaryRow label="Cobrado hoje" value={brl(0)} strong />
              </div>
              <button onClick={() => navigate('/onboarding')} className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>
                Confirmar e configurar loja <I.ArrowRight size={14} />
              </button>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 10, lineHeight: 1.55 }}>
                Primeira cobrança de {brl(charged)} em 2 de outubro de 2026. Avisamos por email 3 dias antes.
                Cancele antes disso sem custo nenhum.
              </div>
            </div>

            <div style={{ padding: '12px 14px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 8, display: 'flex', gap: 10 }}>
              <span style={{ color: 'var(--fg-muted)', flexShrink: 0, marginTop: 1 }}><I.Shield size={14} /></span>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
                Pagamento processado pela Stripe. Não armazenamos dados de cartão em nossos servidores.
              </div>
            </div>
          </div>
        </div>
      </section>
    </LayoutPublic>
  );
}

// === /admin/subscriptions/detail ===

"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { LayoutPublic } from '@/components/layout/layout-public';
import { FormCard } from '@/components/ui/form-card';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { I } from '@/components/icons';
import { SummaryRow } from '@/components/ui/summary-row';
import { brl } from '@/lib/format';
import { signUpAction } from '@/features/auth/actions';

export function Signup({ plans, trialDays, trialEndsOn }) {
  const navigate = useNavigate();
  const activePlans = plans.filter((p) => p.active);
  const [plan, setPlan] = React.useState(() => (activePlans.find((p) => p.popular) ?? activePlans[0])?.id);
  const chosen = activePlans.find(p => p.id === plan) || activePlans[0];
  const firstCharge = new Date(trialEndsOn).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' });
  const [form, setForm] = React.useState({ fullName: '', phone: '', email: '', password: '', storeName: '', cnpj: '' });
  const [terms, setTerms] = React.useState(false);
  const [error, setError] = React.useState('');
  const [pending, startTransition] = React.useTransition();
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = () => {
    setError('');
    if (!terms) { setError('Aceite os termos de uso pra continuar.'); return; }
    if (form.fullName.trim().length < 2) { setError('Informe seu nome.'); return; }
    if (form.password.length < 8) { setError('A senha precisa ter no mínimo 8 caracteres.'); return; }
    if (form.storeName.trim().length < 2) { setError('Informe o nome da loja.'); return; }
    startTransition(async () => {
      const result = await signUpAction({ ...form, planId: plan, acceptedTerms: terms });
      if (result?.error) setError(result.error);
    });
  };

  return (
    <LayoutPublic navigate={navigate} route="/signup">
      <section style={{ maxWidth: 1020, margin: '0 auto', padding: '40px var(--page-pad) 60px' }}>
        <div className="form-split">
          <div>
            <h1 style={{ margin: 0, fontSize: 'clamp(26px, 5vw, 34px)', fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Criar sua conta no Stoqmate
            </h1>
            <p style={{ margin: '12px 0 28px', fontSize: 15, color: 'var(--fg-muted)', maxWidth: 440, lineHeight: 1.55 }}>
              {trialDays} dias grátis. Nenhuma cobrança agora — só pedimos o cartão no fim do período de teste.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <FormCard title="Dados de acesso" cols={2}>
                <Field label="Seu nome" required span={1}><TextInput value={form.fullName} onChange={set('fullName')} placeholder="Mariana Souza" style={{ height: 36 }} /></Field>
                <Field label="Telefone" span={1}><TextInput value={form.phone} onChange={set('phone')} placeholder="(11) 98888-0000" mono style={{ height: 36 }} /></Field>
                <Field label="Email de trabalho" required span={2}><TextInput type="email" value={form.email} onChange={set('email')} placeholder="voce@sualoja.com.br" style={{ height: 36 }} /></Field>
                <Field label="Senha" required hint="Mínimo 8 caracteres" span={2}><TextInput type="password" value={form.password} onChange={set('password')} placeholder="••••••••" style={{ height: 36 }} /></Field>
              </FormCard>

              <FormCard title="Sua loja" desc="Você escolhe as categorias que vende no onboarding." cols={2}>
                <Field label="Nome da loja ou rede" required span={2}><TextInput value={form.storeName} onChange={set('storeName')} placeholder="Ex.: Loja Centro" style={{ height: 36 }} /></Field>
                <Field label="CNPJ" span={2} hint="Opcional agora; dá para preencher depois em Dados da empresa."><TextInput mono value={form.cnpj} onChange={set('cnpj')} placeholder="00.000.000/0001-00" style={{ height: 36 }} /></Field>
              </FormCard>

              <label style={{ display: 'flex', gap: 9, fontSize: 12, color: 'var(--fg-muted)', alignItems: 'flex-start', lineHeight: 1.5 }}>
                <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} style={{ marginTop: 2 }} />
                <span>Concordo com os <a href="#" onClick={(e) => e.preventDefault()} style={{ color: 'var(--accent-text)', fontWeight: 500 }}>Termos de uso</a> e com a <a href="#" onClick={(e) => e.preventDefault()} style={{ color: 'var(--accent-text)', fontWeight: 500 }}>Política de privacidade</a>, incluindo o tratamento de dados conforme a LGPD.</span>
              </label>

              {error && (
                <div style={{ padding: '10px 13px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 7, fontSize: 12.5, color: 'var(--fg)' }}>
                  {error}
                </div>
              )}

              <button onClick={submit} disabled={pending} className="btn btn-primary btn-lg" style={{ justifyContent: 'center', opacity: pending ? 0.7 : 1 }}>
                {pending ? 'Criando…' : <>Criar loja e configurar <I.ArrowRight size={14} /></>}
              </button>
            </div>
          </div>

          {/* Order summary */}
          <div data-sticky style={{ position: 'sticky', top: 80, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ padding: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 12 }}>Escolha seu plano</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {activePlans.map(p => {
                  const active = plan === p.id;
                  return (
                    <button key={p.id} onClick={() => setPlan(p.id)} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px',
                      border: '1px solid ' + (active ? 'var(--accent)' : 'var(--line)'),
                      background: active ? 'var(--accent-soft)' : 'var(--bg-elev)',
                      borderRadius: 7, textAlign: 'left', width: '100%',
                    }}>
                      <span style={{
                        width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                        border: '1px solid ' + (active ? 'var(--accent)' : 'var(--line-strong)'),
                        background: active ? 'var(--accent-strong)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff',
                      }}>{active && <I.Check size={9} stroke={3} />}</span>
                      <span style={{ flex: 1 }}>
                        <span style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--fg)' }}>{p.name}</span>
                        <span style={{ display: 'block', fontSize: 11, color: 'var(--fg-muted)' }}>{p.limits.skus ? `${p.limits.skus} SKUs` : 'SKUs ilimitados'} · {p.credits.toLocaleString('pt-BR')} créditos</span>
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--fg)' }}>R$ {p.monthly}</span>
                    </button>
                  );
                })}
              </div>

              <div style={{ borderTop: '1px solid var(--line)', marginTop: 16, paddingTop: 12 }}>
                <SummaryRow label={`Plano ${chosen.name} · 1 loja`} value={brl(chosen.monthly)} />
                <SummaryRow label={`Teste de ${trialDays} dias`} value={'− ' + brl(chosen.monthly)} tone="success" />
                <div style={{ borderTop: '1px solid var(--line)', marginTop: 8, paddingTop: 8 }}>
                  <SummaryRow label="Cobrado hoje" value={brl(0)} strong />
                </div>
                <div style={{ fontSize: 11, color: 'var(--fg-soft)', marginTop: 8, lineHeight: 1.5 }}>
                  Primeira cobrança de {brl(chosen.monthly)} em {firstCharge}. Cancele antes disso sem custo.
                </div>
              </div>
            </div>

            <div style={{ padding: '12px 14px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 8, display: 'flex', gap: 10 }}>
              <span style={{ color: 'var(--fg-soft)', flexShrink: 0, marginTop: 1 }}><I.Shield size={14} /></span>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
                Pagamento processado pela Stripe. Não armazenamos dados de cartão.
              </div>
            </div>
          </div>
        </div>
      </section>
    </LayoutPublic>
  );
}

// === Auth asides ===

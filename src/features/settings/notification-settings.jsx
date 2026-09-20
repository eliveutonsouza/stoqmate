"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { NOTIF_RULES } from '@/features/settings/notif-rules';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { SettingsLayout } from '@/components/ui/settings-layout';
import { I } from '@/components/icons';
import { SelectInput } from '@/components/ui/select-input';
import { CADENCE } from '@/features/settings/cadence';
import { FormCard } from '@/components/ui/form-card';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { MOCK } from '@/lib/mock';

export function NotificationSettings() {
  const navigate = useNavigate();
  const [rules, setRules] = React.useState(
    Object.fromEntries(NOTIF_RULES.flatMap(g => g.rows.map(r => [r.id, { app: r.app, mail: r.mail, when: r.when }])))
  );
  const set = (id, patch) => setRules(s => ({ ...s, [id]: { ...s[id], ...patch } }));

  const all = Object.values(rules);
  const appOn = all.filter(r => r.app).length;
  const mailOn = all.filter(r => r.mail).length;

  const bulk = (channel, on) => setRules(s => Object.fromEntries(Object.entries(s).map(([k, v]) => [k, { ...v, [channel]: on }])));

  return (
    <StoreShell route="/settings/notifications" breadcrumb={['Configurações', 'Avisos']} navigate={navigate}>
      <PageHeader title="Configurações" sub="Identidade visual, dados da empresa, unidades, equipe e assinatura." />
      <SettingsLayout route="/settings/notifications" navigate={navigate}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
          {[
            { l: 'Avisos no painel', v: `${appOn}`, s: `de ${all.length} eventos` },
            { l: 'Avisos por email', v: `${mailOn}`, s: 'para ana@bonsucesso.com.br' },
            { l: 'Emails na semana', v: '14', s: 'estimado pela sua escolha' },
            { l: 'Recorrentes', v: `${all.filter(r => r.when.includes('semanal') || r.when.includes('diário') || r.when === 'mensal').length}`, s: 'resumos agendados' },
          ].map((m, i) => (
            <div key={i} style={{ padding: '14px 16px', borderRight: i < 3 ? '1px solid var(--line)' : 'none' }}>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{m.l}</div>
              <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>{m.v}</div>
              <div style={{ fontSize: 10.5, color: 'var(--fg-muted)', marginTop: 2 }}>{m.s}</div>
            </div>
          ))}
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          padding: '11px 14px', background: 'var(--bg-sunken)',
          border: '1px solid var(--line)', borderRadius: 8,
        }}>
          <span style={{ fontSize: 12.5, color: 'var(--fg-muted)', flex: 1, lineHeight: 1.5 }}>
            Você escolhe evento por evento: no painel, por email, ou os dois — e com que frequência.
            Eventos críticos chegam na hora; o resto pode vir agrupado.
          </span>
          <button onClick={() => bulk('mail', false)} className="btn btn-outline btn-sm">Desligar todos os emails</button>
          <button onClick={() => bulk('app', true)} className="btn btn-outline btn-sm">Ligar tudo no painel</button>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Regras de aviso</h3>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Vale para o seu usuário. Cada pessoa da equipe tem as suas.</p>
            </div>
            <button onClick={() => navigate('/notifications')} className="btn btn-ghost btn-sm">Ver caixa de avisos <I.ChevronRight size={12} /></button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '44%' }}>Evento</th>
                <th style={{ textAlign: 'center', width: 84 }}>Painel</th>
                <th style={{ textAlign: 'center', width: 84 }}>Email</th>
                <th style={{ width: 190 }}>Frequência</th>
              </tr>
            </thead>
            <tbody>
              {NOTIF_RULES.map(g => (
                <React.Fragment key={g.g}>
                  <tr>
                    <td colSpan={4} style={{
                      background: 'var(--bg-sunken)', fontSize: 11, fontWeight: 500,
                      color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.05em',
                      padding: '7px 12px',
                    }}>{g.g}</td>
                  </tr>
                  {g.rows.map(r => {
                    const st = rules[r.id];
                    const off = !st.app && !st.mail;
                    return (
                      <tr key={r.id} style={{ opacity: off ? 0.55 : 1 }}>
                        <td>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{r.l}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 2 }}>{r.d}</div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input type="checkbox" checked={st.app} onChange={() => set(r.id, { app: !st.app })} />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input type="checkbox" checked={st.mail} onChange={() => set(r.id, { mail: !st.mail })} />
                        </td>
                        <td>
                          {off
                            ? <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>desligado</span>
                            : <SelectInput value={st.when} onChange={(v) => set(r.id, { when: v })} options={CADENCE} />}
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <FormCard title="Para onde enviar" desc="Além do seu email de login, avisos operacionais podem ir para um endereço da equipe." cols={2}
          footer={<button className="btn btn-primary">Salvar preferências</button>}>
          <Field label="Email principal" span={1} hint="Do seu usuário — não muda aqui.">
            <TextInput value="ana@bonsucesso.com.br" readOnly style={{ background: 'var(--bg-sunken)' }} />
          </Field>
          <Field label="Cópia para" span={1} hint="Opcional. Ex.: caixa compartilhada da gerência.">
            <TextInput placeholder="gerencia@bonsucesso.com.br" />
          </Field>
          <Field label="Unidades que me interessam" span={2} hint="Você só recebe avisos das unidades marcadas.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {MOCK.store.siblings.map((s, i) => (
                <label key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                  <input type="checkbox" defaultChecked={i < 2} /> {s.name.replace('Centro de Distribuição', 'CD')}
                </label>
              ))}
            </div>
          </Field>
          <Field label="Horário de silêncio" span={1} hint="Avisos não críticos ficam retidos nesse intervalo.">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TextInput mono defaultValue="22:00" style={{ width: 90 }} />
              <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>às</span>
              <TextInput mono defaultValue="07:00" style={{ width: 90 }} />
            </div>
          </Field>
          <Field label="Agrupar avisos semelhantes" span={1} hint="Evita 20 emails de ruptura no mesmo dia.">
            <SelectInput value="Sim, em um email por tipo" onChange={() => {}}
              options={['Não agrupar', 'Sim, em um email por tipo', 'Sim, em um email único por dia']} />
          </Field>
        </FormCard>

        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Últimos emails enviados</h3>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Para conferir se está chegando — e o que está chegando demais.</p>
          </div>
          <table className="table">
            <thead>
              <tr><th>Quando</th><th>Assunto</th><th>Regra</th><th>Destino</th><th>Status</th></tr>
            </thead>
            <tbody>
              {[
                ['18/09 20:00', 'Resumo do dia · R$ 6.284 em 142 atendimentos', 'Resumo do dia', 'ana@bonsucesso.com.br', 'ok'],
                ['18/09 14:41', '7 SKUs em ruptura em Loja Centro', 'Ruptura de estoque', 'ana@bonsucesso.com.br', 'ok'],
                ['18/09 07:00', '12 sugestões de IA esperando revisão', 'Fila de aprovação', 'ana@bonsucesso.com.br', 'ok'],
                ['16/09 08:00', 'Sugestão de compra da semana · 7 SKUs, R$ 43.104', 'Sugestão de compra', 'ana + gerencia', 'ok'],
                ['15/09 11:22', 'Anomalia: estoque fantasma em Camiseta Pima Branco M', 'Anomalia detectada', 'ana@bonsucesso.com.br', 'ok'],
                ['01/09 10:02', 'Fatura de setembro paga · R$ 89,00', 'Fatura paga', 'mariana@bonsucesso.com.br', 'ok'],
              ].map(([when, subj, rule, to, st], i) => (
                <tr key={i}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)' }}>{when}</td>
                  <td style={{ fontSize: 13 }}>{subj}</td>
                  <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{rule}</td>
                  <td style={{ fontSize: 11.5, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{to}</td>
                  <td><span className="badge badge-success"><I.Check size={10} stroke={3} /> Entregue</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SettingsLayout>
    </StoreShell>
  );
}

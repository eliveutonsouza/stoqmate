"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { AI_FEATURES } from '@/features/ai/ai-constants';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { FormCard } from '@/components/ui/form-card';
import { Field } from '@/components/ui/field';
import { SelectInput } from '@/components/ui/select-input';
import { TextInput } from '@/components/ui/text-input';
import { AIQuotaCard } from '@/features/ai/ai-quota-card';
import { SummaryRow } from '@/components/ui/summary-row';

export function AIHub({ quota }) {
  const navigate = useNavigate();
  const [features, setFeatures] = React.useState(AI_FEATURES);
  const toggle = (id) => setFeatures(fs => fs.map(f => (f.id === id ? { ...f, on: !f.on } : f)));
  const onCount = features.filter(f => f.on).length;

  return (
    <StoreShell route="/ai" breadcrumb={['Inteligência artificial']} navigate={navigate}
      headerActions={(
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--fg-muted)' }}>
          <span className="pulse"></span><span>{onCount} de {features.length} recursos ativos</span>
        </div>
      )}
    >
      <PageHeader
        title="Inteligência artificial"
        sub="A IA propõe, você confirma. Nada entra no estoque sem uma pessoa aprovar."
        actions={(
          <>
            <button onClick={() => navigate('/ai/queue')} className="btn btn-outline btn-sm">
              <I.Check size={13} /> Fila de revisão <span className="badge badge-accent" style={{ marginLeft: 4 }}>12</span>
            </button>
            <button onClick={() => navigate('/settings/notifications')} className="btn btn-outline btn-sm"><I.Bell size={13} /> Avisos</button>
          </>
        )}
      />
      <Page gap={20}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 16, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', background: 'var(--accent-soft)',
              border: '1px solid var(--accent)', borderRadius: 8,
            }}>
              <span style={{ color: 'var(--accent-text)', flexShrink: 0 }}><I.Check size={15} /></span>
              <span style={{ fontSize: 12.5, color: 'var(--fg)', flex: 1, lineHeight: 1.5 }}>
                <strong>12 sugestões esperando revisão</strong> — 6 de OCR de nota, 4 de reposição e 2 de anomalia.
                Nenhuma foi aplicada ainda.
              </span>
              <button onClick={() => navigate('/ai/queue')} className="btn btn-primary btn-sm">Revisar agora</button>
            </div>

            <div>
              <div className="section-h"><h3>Recursos</h3></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {features.map(f => {
                  const Ico = I[f.icon] || I.Sparkle;
                  return (
                    <div key={f.id} className="card" style={{ padding: 16, display: 'flex', gap: 13, alignItems: 'flex-start' }}>
                      <span style={{
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        background: f.on ? 'var(--accent-soft)' : 'var(--bg-sunken)',
                        color: f.on ? 'var(--accent-text)' : 'var(--fg-muted)',
                        border: '1px solid ' + (f.on ? 'transparent' : 'var(--line)'),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}><Ico size={16} /></span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.012em' }}>{f.name}</span>
                          {f.on
                            ? <span className="badge badge-success"><span className="badge-dot"></span> Ativo</span>
                            : <span className="badge">Desativado</span>}
                        </div>
                        <p style={{ margin: '5px 0 0', fontSize: 12.5, color: 'var(--fg-muted)', lineHeight: 1.5 }}>{f.what}</p>
                        <div style={{ display: 'flex', gap: 14, marginTop: 9, fontSize: 11, color: 'var(--fg-muted)' }}>
                          <span>Aparece em <strong style={{ color: 'var(--fg)', fontWeight: 500 }}>{f.where}</strong></span>
                          <span>·</span>
                          <span>{f.saves}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0 }}>
                        <button onClick={() => toggle(f.id)} className={f.on ? 'btn btn-outline btn-sm' : 'btn btn-primary btn-sm'}>
                          {f.on ? 'Desativar' : 'Ativar'}
                        </button>
                        {f.on && <button onClick={() => navigate(f.route)} className="btn btn-ghost btn-sm">Abrir</button>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <FormCard title="Como a IA se comporta" desc="Vale para todos os recursos ativos." cols={2}
              footer={<button className="btn btn-primary">Salvar alterações</button>}>
              <Field label="Nível de autonomia" span={2} hint="Sua escolha atual exige revisão de tudo — nada é aplicado sozinho.">
                <SelectInput value="Sempre revisar" onChange={() => {}} options={[
                  'Sempre revisar — nada é aplicado sozinho',
                  'Confiança graduada — acima de 95% aplica, resto revisa',
                  'Automático com desfazer em 7 dias',
                ]} />
              </Field>
              <Field label="Confiança mínima para sugerir" span={1} hint="Abaixo disso a IA se cala em vez de chutar.">
                <TextInput mono defaultValue="70" suffix="%" />
              </Field>
              <Field label="Quem pode aprovar sugestões" span={1}>
                <SelectInput value="Gestor de Estoque e acima" onChange={() => {}}
                  options={['Qualquer usuário', 'Gestor de Estoque e acima', 'Só Gestor Financeiro e Proprietário']} />
              </Field>
              <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 6, borderTop: '1px solid var(--line-soft)' }}>
                {[
                  ['Registrar toda sugestão no log de alterações', true],
                  ['Guardar o motivo da recusa para melhorar as próximas', true],
                  ['Pausar IA automaticamente ao esgotar a cota do plano', true],
                  ['Permitir que a IA leia nomes de clientes', false],
                ].map(([l, on]) => (
                  <label key={l} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 12.5, cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked={on} /> {l}
                  </label>
                ))}
              </div>
            </FormCard>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 0 }}>
            <AIQuotaCard navigate={navigate} quota={quota} />

            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 10 }}>Impacto em setembro</div>
              <SummaryRow label="Sugestões geradas" value="1.418" />
              <SummaryRow label="Aceitas" value="1.184 · 84%" tone="success" />
              <SummaryRow label="Recusadas" value="222 · 16%" />
              <div style={{ borderTop: '1px solid var(--line)', marginTop: 8, paddingTop: 8 }}>
                <SummaryRow label="Tempo economizado" value="~64 h" strong tone="success" />
              </div>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 8, lineHeight: 1.5 }}>
                Estimado pelo tempo médio de digitação manual de cada tarefa.
              </div>
            </div>

            <div style={{ padding: '12px 14px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 8, display: 'flex', gap: 10 }}>
              <span style={{ color: 'var(--fg-muted)', flexShrink: 0, marginTop: 1 }}><I.Shield size={14} /></span>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
                Seus dados não treinam modelos. As chamadas enviam apenas o necessário para a tarefa —
                nunca dados de cliente, a menos que você autorize acima.
              </div>
            </div>
          </div>
        </div>
      </Page>
    </StoreShell>
  );
}

// === /ai/queue — the approval spine ===

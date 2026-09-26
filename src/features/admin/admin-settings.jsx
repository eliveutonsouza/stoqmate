"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { AdminShell } from '@/components/ui/admin-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Page } from '@/components/ui/page-container';
import { FormCard } from '@/components/ui/form-card';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { I } from '@/components/icons';
import { updatePlatformSettingsAction } from '@/features/admin/actions';

const usd = (n) => 'US$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const SOON = { disabled: true, title: 'Em breve' };

export function AdminSettings({ settings, aiMonth, integrations }) {
  const navigate = useNavigate();
  const [trialDays, setTrialDays] = React.useState(settings.trialDays);
  const [ceiling, setCeiling] = React.useState(settings.aiSpendCeilingUsd);
  const [alertPct, setAlertPct] = React.useState(settings.aiAlertPct);
  const [feedback, setFeedback] = React.useState(null);
  const [pending, startTransition] = React.useTransition();

  const save = () => {
    setFeedback(null);
    startTransition(async () => {
      const result = await updatePlatformSettingsAction({
        trialDays: Number(trialDays), aiSpendCeilingUsd: Number(ceiling), aiAlertPct: Number(alertPct),
      });
      setFeedback(result?.error ? { tone: 'danger', text: result.error } : { tone: 'success', text: 'Configurações salvas.' });
    });
  };

  const alertAt = (Number(ceiling) * Number(alertPct)) / 100;
  const projectionTone = aiMonth.projection >= Number(ceiling) ? 'danger' : aiMonth.projection >= alertAt ? 'warning' : 'success';
  const saveButton = <button onClick={save} disabled={pending} className="btn btn-primary">{pending ? 'Salvando…' : 'Salvar alterações'}</button>;

  return (
    <AdminShell route="/admin/settings" breadcrumb={['Configurações']} navigate={navigate}>
      <PageHeader title="Configurações da plataforma" sub="Duração do trial, tetos de IA e integrações." />
      <Page width={880}>
        {feedback && (
          <div style={{ padding: '10px 12px', background: `var(--${feedback.tone}-soft)`, border: `1px solid var(--${feedback.tone})`, borderRadius: 7, fontSize: 12 }}>
            {feedback.text}
          </div>
        )}

        <FormCard title="Cadastro" desc="Vale para toda rede nova criada a partir de agora (signup e console)." cols={2} footer={saveButton}>
          <Field label="Duração do trial" span={1} hint="Entre 1 e 90 dias.">
            <TextInput mono type="number" min={1} max={90} value={trialDays} onChange={(e) => setTrialDays(e.target.value)} suffix="dias" />
          </Field>
          <Field label="Limites por plano" span={1} hint="SKUs, usuários, lojas e cota de IA ficam no catálogo de planos.">
            <button onClick={() => navigate('/admin/plans')} className="btn btn-outline btn-sm" style={{ height: 36 }}>Abrir planos</button>
          </Field>
        </FormCard>

        <FormCard title="Monitoramento de IA" desc="Teto mensal de gasto com inferência e ponto de alerta." cols={2} footer={saveButton}>
          <Field label="Teto mensal de gasto" span={1}>
            <TextInput mono type="number" min={0} prefix="US$" value={ceiling} onChange={(e) => setCeiling(e.target.value)} />
          </Field>
          <Field label="Alerta em" span={1} hint={`% do teto — hoje ${usd(alertAt || 0)}.`}>
            <TextInput mono type="number" min={1} max={100} value={alertPct} onChange={(e) => setAlertPct(e.target.value)} suffix="%" />
          </Field>
          <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', background: `var(--${projectionTone}-soft)`, border: `1px solid var(--${projectionTone})`, borderRadius: 7 }}>
            <span style={{ color: `var(--${projectionTone})` }}><I.Alert size={15} /></span>
            <div style={{ fontSize: 12, flex: 1, lineHeight: 1.5 }}>
              Gasto no mês: <strong>{usd(aiMonth.spend)}</strong> · projeção até o fim do mês: <strong>{usd(aiMonth.projection)}</strong>
              {projectionTone === 'danger' && ' — ultrapassa o teto configurado.'}
              {projectionTone === 'warning' && ' — acima do ponto de alerta.'}
            </div>
            <button onClick={() => navigate('/admin/ai-monitoring')} className="btn btn-outline btn-sm">Ver monitor</button>
          </div>
        </FormCard>

        <FormCard title="Integrações" desc="Status lido da configuração do servidor. Chaves são trocadas nas variáveis de ambiente do deploy." cols={1}>
          {integrations.map((it, i, arr) => (
            <div key={it.name} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 0',
              borderBottom: i < arr.length - 1 ? '1px solid var(--line-soft)' : 'none',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{it.name}</div>
                <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>{it.desc}</div>
              </div>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-soft)' }}>{it.ref}</span>
              {it.unverified
                ? <span className="badge badge-warning">Verificar no Supabase</span>
                : it.connected
                  ? <span className="badge badge-success"><span className="badge-dot"></span> Chave configurada</span>
                  : <span className="badge">Não configurado</span>}
            </div>
          ))}
        </FormCard>

        <FormCard title="Branding da plataforma" desc="Em breve — ainda sem efeito no produto." cols={2}>
          <Field label="Nome do produto" span={1}><TextInput {...SOON} defaultValue="Stoqmate" /></Field>
          <Field label="Domínio principal" span={1}><TextInput {...SOON} mono defaultValue="stoqmate.com.br" /></Field>
          <Field label="Email remetente" span={1} hint="Nenhum email transacional próprio é enviado hoje."><TextInput {...SOON} type="email" placeholder="Não configurado" /></Field>
          <Field label="Logo da plataforma" span={1}>
            <button {...SOON} className="btn btn-outline btn-sm" style={{ height: 36 }}>Substituir logo</button>
          </Field>
        </FormCard>

        <FormCard title="Limites de upload" desc="Valores fixos no código hoje — ainda não editáveis por aqui." cols={2}>
          <Field label="Foto de produto" span={1}><TextInput disabled mono value="4" suffix="MB" /></Field>
          <Field label="Logo e avatar" span={1}><TextInput disabled mono value="2" suffix="MB" /></Field>
        </FormCard>

        <FormCard title="Políticas globais" desc="Em breve — ainda sem efeito no produto. Nenhuma destas políticas é aplicada hoje." cols={2}>
          <Field label="Retenção após cancelamento" span={1}><TextInput {...SOON} mono placeholder="Não definido" suffix="dias" /></Field>
          <Field label="Tolerância de inadimplência" span={1}><TextInput {...SOON} mono placeholder="Não definido" suffix="dias" /></Field>
          <Field label="Rate limit da API" span={1}><TextInput {...SOON} mono placeholder="Não definido" suffix="req/min" /></Field>
          <Field label="Sessão administrativa" span={1}><TextInput {...SOON} mono placeholder="Não definido" suffix="min" /></Field>
        </FormCard>
      </Page>
    </AdminShell>
  );
}

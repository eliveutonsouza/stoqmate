"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { AdminShell } from '@/components/ui/admin-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Page } from '@/components/ui/page-container';
import { FormCard } from '@/components/ui/form-card';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { I } from '@/components/icons';
import { SelectInput } from '@/components/ui/select-input';

export function AdminSettings() {
  const navigate = useNavigate();
  return (
    <AdminShell route="/admin/settings" breadcrumb={['Configurações']} navigate={navigate}>
      <PageHeader title="Configurações da plataforma" sub="Branding, domínios, limites globais e integrações." />
      <Page width={880}>
        <FormCard title="Branding da plataforma" desc="Usado nas páginas públicas, emails transacionais e no console." cols={2}
          footer={<><button className="btn btn-ghost">Descartar</button><button className="btn btn-primary">Salvar alterações</button></>}>
          <Field label="Nome do produto" span={1}><TextInput defaultValue="Stoqmate" /></Field>
          <Field label="Domínio principal" span={1}><TextInput mono defaultValue="stoqmate.com.br" /></Field>
          <Field label="Domínio de demonstração" span={1} hint="Usado em apresentações comerciais."><TextInput mono defaultValue="demo.stoqmate.com.br" /></Field>
          <Field label="Email remetente" span={1}><TextInput type="email" defaultValue="nao-responda@stoqmate.com.br" /></Field>
          <Field label="Logo da plataforma" span={2}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 10, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <I.Brand size={32} />
              </div>
              <button className="btn btn-outline btn-sm">Substituir logo</button>
            </div>
          </Field>
        </FormCard>

        <FormCard title="Limites e políticas globais" desc="Aplicados a todas as redes, independentemente do plano." cols={2}
          footer={<button className="btn btn-primary">Salvar alterações</button>}>
          <Field label="Duração do trial" span={1}><TextInput mono defaultValue="14" suffix="dias" /></Field>
          <Field label="Retenção após cancelamento" span={1}><TextInput mono defaultValue="90" suffix="dias" /></Field>
          <Field label="Tamanho máximo de foto" span={1}><TextInput mono defaultValue="5" suffix="MB" /></Field>
          <Field label="Tolerância de inadimplência" span={1} hint="Dias antes da suspensão automática."><TextInput mono defaultValue="7" suffix="dias" /></Field>
          <Field label="Rate limit da API" span={1}><TextInput mono defaultValue="600" suffix="req/min" /></Field>
          <Field label="Sessão administrativa" span={1} hint="Expiração por inatividade."><TextInput mono defaultValue="30" suffix="min" /></Field>
        </FormCard>

        <FormCard title="Integrações" cols={1}>
          {[
            ['Stripe', 'Cobrança e assinaturas', 'connected', 'acct_1P8x…4Kq2'],
            ['OpenAI', 'Classificação de produtos, OCR de notas, previsão de demanda', 'connected', 'sk-proj-…8fW1'],
            ['Resend', 'Emails transacionais', 'connected', 're_8Kd…mN4'],
            ['Google Analytics', 'Métricas das páginas públicas', 'disconnected', '—'],
            ['Slack', 'Alertas de churn e inadimplência', 'connected', '#alertas-saas'],
          ].map(([name, desc, status, ref], i, arr) => (
            <div key={name} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 0',
              borderBottom: i < arr.length - 1 ? '1px solid var(--line-soft)' : 'none',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{name}</div>
                <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>{desc}</div>
              </div>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-soft)' }}>{ref}</span>
              {status === 'connected'
                ? <span className="badge badge-success"><span className="badge-dot"></span> Conectado</span>
                : <span className="badge">Desconectado</span>}
              <button className="btn btn-outline btn-sm">{status === 'connected' ? 'Gerenciar' : 'Conectar'}</button>
            </div>
          ))}
        </FormCard>

        <FormCard title="Monitoramento de IA" desc="Tetos de gasto e comportamento ao atingir o limite." cols={2}
          footer={<button className="btn btn-primary">Salvar alterações</button>}>
          <Field label="Teto mensal de gasto" span={1}><TextInput mono prefix="US$" defaultValue="2500" /></Field>
          <Field label="Alerta em" span={1} hint="% do teto para notificar."><TextInput mono defaultValue="80" suffix="%" /></Field>
          <Field label="Ação ao atingir o teto" span={2}>
            <SelectInput value="Rate-limit progressivo por plano" onChange={() => {}}
              options={['Apenas notificar','Rate-limit progressivo por plano','Desativar recursos de IA no Balcão','Desativar IA em todas as lojas']} />
          </Field>
          <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', background: 'var(--warning-soft)', border: '1px solid var(--warning)', borderRadius: 7 }}>
            <span style={{ color: 'var(--warning)' }}><I.Alert size={15} /></span>
            <div style={{ fontSize: 12, flex: 1, lineHeight: 1.5 }}>
              Projeção atual de <strong>US$ 2.840</strong> ultrapassa o teto configurado.
            </div>
            <button onClick={() => navigate('/admin/ai-monitoring')} className="btn btn-outline btn-sm">Ver monitor</button>
          </div>
        </FormCard>
      </Page>
    </AdminShell>
  );
}

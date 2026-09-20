"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { PLANS } from '@/lib/plans';
import { AdminShell } from '@/components/ui/admin-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Page } from '@/components/ui/page-container';
import { FormCard } from '@/components/ui/form-card';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { SelectInput } from '@/components/ui/select-input';
import { PlanBadge } from '@/components/domain/plan-badge';
import { brl } from '@/lib/format';
import { SummaryRow } from '@/components/ui/summary-row';
import { FormPageFooter } from '@/components/ui/form-page-footer';

export function AdminStoreForm({ mode = 'new' }) {
  const navigate = useNavigate();
  const editing = mode === 'edit';
  const [plan, setPlan] = React.useState(editing ? 'Controle' : 'Balcão');
  const [status, setStatus] = React.useState(editing ? 'active' : 'trial');

  const planRow = (PLANS.find(p => p.name === plan) || PLANS[1]).monthly;

  return (
    <AdminShell route={editing ? '/admin/stores/edit' : '/admin/stores/new'} breadcrumb={['Clientes', editing ? 'Editar rede' : 'Nova rede']} navigate={navigate}>
      <PageHeader
        title={editing ? 'Editar rede' : 'Nova rede'}
        sub={editing
          ? 'Bonsucesso Varejo · 4 lojas · cliente desde fev 2025'
          : 'Criar um inquilino manualmente. Normalmente isso acontece pelo autosserviço no site.'}
      />
      <Page>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 16, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <FormCard title="Identificação" cols={2}>
              <Field label="Nome da rede" required span={2}>
                <TextInput defaultValue={editing ? 'Bonsucesso Varejo' : ''} placeholder="Bonsucesso Varejo" />
              </Field>
              <Field label="Razão social" span={2}>
                <TextInput defaultValue={editing ? 'Bonsucesso Comércio Varejista Ltda.' : ''} placeholder="Razão social completa" />
              </Field>
              <Field label="CNPJ" required span={1}>
                <TextInput mono defaultValue={editing ? '24.531.908/0001-72' : ''} placeholder="00.000.000/0001-00" />
              </Field>
              <Field label="Subdomínio" required span={1} hint="Endereço da rede no sistema.">
                <TextInput mono defaultValue={editing ? 'bonsucesso' : ''} placeholder="minharede" suffix=".app" />
              </Field>
              <Field label="Segmento" required span={1} hint="Usado nos relatórios de adoção por ramo.">
                <SelectInput value={editing ? 'Varejo multicategoria' : 'Varejo multicategoria'} onChange={() => {}}
                  options={['Varejo multicategoria', 'Vestuário', 'Calçados', 'Eletrônicos', 'Alimentos e bebidas', 'Material de construção', 'Farmácia', 'Autopeças', 'Papelaria', 'Casa e decoração', 'Outro']} />
              </Field>
              <Field label="Cidade e estado" required span={1}>
                <TextInput defaultValue={editing ? 'São Paulo · SP' : ''} placeholder="São Paulo · SP" />
              </Field>
            </FormCard>

            <FormCard title="Contato do responsável" desc={editing ? 'Recebe as cobranças e os avisos da plataforma.' : 'Recebe o convite de acesso e passa pelo onboarding.'} cols={2}>
              <Field label="Nome" required span={1}>
                <TextInput defaultValue={editing ? 'Mariana Souza' : ''} placeholder="Nome do proprietário" />
              </Field>
              <Field label="Telefone" span={1}>
                <TextInput mono defaultValue={editing ? '(11) 3813-4400' : ''} placeholder="(11) 3000-0000" />
              </Field>
              <Field label="Email" required span={2} hint={editing ? null : 'O convite de primeiro acesso vai para este endereço.'}>
                <TextInput type="email" defaultValue={editing ? 'mariana@bonsucesso.com.br' : ''} placeholder="responsavel@empresa.com.br" />
              </Field>
            </FormCard>

            <FormCard title="Plano e assinatura" cols={1}>
              <Field label="Plano" required>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {[
                    { n: 'Balcão', p: 390, l: '500 SKUs · 2 usuários · 1 loja' },
                    { n: 'Controle', p: 890, l: 'SKUs ilimitados · 10 usuários · 5 lojas' },
                    { n: 'Rede', p: 1490, l: 'Tudo ilimitado · API · CSM' },
                  ].map(o => {
                    const on = plan === o.n;
                    return (
                      <button key={o.n} onClick={() => setPlan(o.n)} style={{
                        display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'left',
                        padding: '11px 13px',
                        border: '1px solid ' + (on ? 'var(--accent)' : 'var(--line)'),
                        background: on ? 'var(--accent-soft)' : 'var(--bg-elev)',
                        borderRadius: 7,
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                          <PlanBadge plan={o.n} />
                          <span style={{ flex: 1 }}></span>
                          <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--fg)' }}>{brl(o.p / 10)}</span>
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--fg-muted)', lineHeight: 1.4 }}>{o.l}</span>
                      </button>
                    );
                  })}
                </div>
              </Field>

              <Field label="Status da assinatura" required>
                <div style={{ display: 'flex', gap: 2, padding: 3, background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 7 }}>
                  {[
                    { k: 'trial', l: 'Trial' },
                    { k: 'active', l: 'Ativa' },
                    { k: 'past_due', l: 'Inadimplente' },
                    { k: 'cancelled', l: 'Cancelada' },
                  ].map(o => (
                    <button key={o.k} onClick={() => setStatus(o.k)} style={{
                      flex: 1, background: status === o.k ? 'var(--bg-elev)' : 'transparent',
                      border: '1px solid ' + (status === o.k ? 'var(--line)' : 'transparent'),
                      borderRadius: 5, padding: '6px 10px', fontSize: 12.5, fontWeight: 500,
                      color: status === o.k ? 'var(--fg)' : 'var(--fg-muted)',
                    }}>{o.l}</button>
                  ))}
                </div>
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {status === 'trial' ? (
                  <Field label="Trial termina em" hint="Padrão da plataforma: 30 dias.">
                    <TextInput type="date" defaultValue="2026-10-02" />
                  </Field>
                ) : (
                  <Field label="Início do ciclo atual">
                    <TextInput type="date" defaultValue="2026-09-01" />
                  </Field>
                )}
                <Field label="Ciclo de cobrança">
                  <SelectInput value="Mensal" onChange={() => {}} options={['Mensal', 'Anual']} />
                </Field>
              </div>
            </FormCard>

            {!editing && (
              <FormCard title="Dados iniciais" desc="Facilita a demonstração comercial." cols={1}>
                {[
                  ['Gerar catálogo de exemplo', 'SKUs, fornecedores, locais e 30 dias de histórico', true],
                  ['Enviar convite de acesso agora', 'Email com link para definir senha e fazer o onboarding', true],
                  ['Pular o onboarding', 'A rede cai direto no dashboard com as categorias padrão', false],
                ].map(([t, d, on], i, arr) => (
                  <label key={t} style={{ display: 'flex', gap: 11, alignItems: 'flex-start', padding: '9px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--line-soft)' : 'none', cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked={on} style={{ marginTop: 3 }} />
                    <span>
                      <span style={{ display: 'block', fontSize: 13, fontWeight: 500 }}>{t}</span>
                      <span style={{ display: 'block', fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>{d}</span>
                    </span>
                  </label>
                ))}
              </FormCard>
            )}

            {editing && (
              <div className="card" style={{ borderColor: 'var(--danger)', overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--danger)' }}>Ações sensíveis</h3>
                </div>
                <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    ['Suspender acesso', 'A rede perde o acesso, os dados são mantidos. Usado em inadimplência.', 'Suspender'],
                    ['Forçar novo onboarding', 'A rede refaz a configuração inicial no próximo acesso.', 'Reiniciar'],
                    ['Excluir rede', 'Cancela a assinatura e agenda a remoção dos dados em 90 dias.', 'Excluir'],
                  ].map(([t, d, btn], i, arr) => (
                    <React.Fragment key={t}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{t}</div>
                          <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>{d}</div>
                        </div>
                        <button className={btn === 'Excluir' ? 'btn btn-danger btn-sm' : 'btn btn-outline btn-sm'}>{btn}</button>
                      </div>
                      {i < arr.length - 1 && <div style={{ height: 1, background: 'var(--line-soft)' }}></div>}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 10 }}>Resumo</div>
              <SummaryRow label="Plano" value={plan} />
              <SummaryRow label="Status" value={{ trial: 'Trial', active: 'Ativa', past_due: 'Inadimplente', cancelled: 'Cancelada' }[status]} />
              <SummaryRow label="Ciclo" value="Mensal" />
              <div style={{ borderTop: '1px solid var(--line)', marginTop: 8, paddingTop: 8 }}>
                <SummaryRow label={status === 'trial' ? 'Após o trial' : 'MRR'} value={brl(planRow / 10)} strong tone={status === 'trial' ? undefined : 'success'} />
              </div>
              {status === 'trial' && (
                <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 10, lineHeight: 1.5 }}>
                  Nenhuma cobrança durante o trial. A primeira fatura sai em 02 de outubro de 2026.
                </div>
              )}
            </div>

            {editing && (
              <div className="card" style={{ padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 10 }}>Uso atual</div>
                <SummaryRow label="Lojas" value="4 / 5" />
                <SummaryRow label="Usuários" value="8 / 10" />
                <SummaryRow label="SKUs" value="1.688" />
                <SummaryRow label="Categorias" value="6" />
                <div style={{ borderTop: '1px solid var(--line)', marginTop: 8, paddingTop: 8 }}>
                  <SummaryRow label="LTV acumulado" value={brl(6230)} tone="success" />
                </div>
              </div>
            )}
          </div>
        </div>

        <FormPageFooter
          onCancel={() => navigate('/admin/stores')}
          onSave={() => navigate(editing ? '/admin/stores/detail' : '/admin/stores')}
          saveLabel={editing ? 'Salvar alterações' : 'Criar rede'}
        />
      </Page>
    </AdminShell>
  );
}

// === /admin/plans/new · /admin/plans/edit ===

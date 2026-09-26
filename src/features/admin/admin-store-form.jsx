"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
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
import { createTenantAction, updateTenantAction } from '@/features/admin/actions';

const STATUS_OPTIONS = [
  { k: 'trial', l: 'Trial' }, { k: 'active', l: 'Ativa' },
  { k: 'past_due', l: 'Inadimplente' }, { k: 'canceled', l: 'Cancelada' },
];

/** @param {{ mode?: string, plans: any[], detail?: any }} props */
export function AdminStoreForm({ mode = 'new', plans, detail }) {
  const navigate = useNavigate();
  const editing = mode === 'edit';
  const tenant = detail?.tenant;
  const owner = detail?.owner;

  const [name, setName] = React.useState(tenant?.name ?? '');
  const [legalName, setLegalName] = React.useState(tenant?.legal_name ?? '');
  const [cnpj, setCnpj] = React.useState(tenant?.cnpj ?? '');
  const [subdomain, setSubdomain] = React.useState('');
  const [segment, setSegment] = React.useState(tenant?.segment ?? '');
  const [city, setCity] = React.useState(tenant?.city ?? '');
  const [state, setState] = React.useState(tenant?.state ?? '');
  const [ownerName, setOwnerName] = React.useState(owner?.name ?? '');
  const [ownerEmail, setOwnerEmail] = React.useState(owner?.email ?? '');
  const [planId, setPlanId] = React.useState(tenant?.plan_id ?? plans[0]?.id ?? '');
  const [status, setStatus] = React.useState(tenant?.status ?? 'trial');
  const [error, setError] = React.useState('');
  const [pending, startTransition] = React.useTransition();

  const plan = plans.find((p) => p.id === planId) ?? plans[0];
  const priceForPlan = (p) => (status === 'trial' ? p?.monthly_price : p?.monthly_price) ?? 0;

  if (editing && !detail) {
    return (
      <AdminShell route="/admin/stores/edit" breadcrumb={['Clientes', 'Editar rede']} navigate={navigate}>
        <PageHeader title="Rede não encontrada" />
        <Page><div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--fg-muted)' }}>Rede não encontrada.</div></Page>
      </AdminShell>
    );
  }

  const submit = () => {
    if (pending) return;
    setError('');
    if (!name || (!editing && (!subdomain || !ownerEmail || !ownerName))) {
      setError('Preencha os campos obrigatórios.');
      return;
    }
    startTransition(async () => {
      const result = editing
        ? await updateTenantAction({ tenantId: tenant.id, name, cnpj, planId, status, legalName, segment, city, state })
        : await createTenantAction({ name, subdomain, cnpj, planId, legalName, segment, city, state, ownerName, ownerEmail });
      if (result?.error) { setError(result.error); return; }
      navigate(editing ? `/admin/stores/detail?id=${tenant.id}` : '/admin/stores');
    });
  };

  return (
    <AdminShell route={editing ? '/admin/stores/edit' : '/admin/stores/new'} breadcrumb={['Clientes', editing ? 'Editar rede' : 'Nova rede']} navigate={navigate}>
      <PageHeader
        title={editing ? 'Editar rede' : 'Nova rede'}
        sub={editing
          ? `${tenant.name} · rede desde ${new Date(tenant.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}`
          : 'Criar um inquilino manualmente. Normalmente isso acontece pelo autosserviço no site.'}
      />
      <Page>
        <div className="split-aside" style={{ '--aside': '320px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            {error && <div style={{ padding: '10px 12px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 7, fontSize: 12.5 }}>{error}</div>}

            <FormCard title="Identificação" cols={2}>
              <Field label="Nome da rede" required span={2}>
                <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Rede Centro" />
              </Field>
              <Field label="Razão social" span={2}>
                <TextInput value={legalName} onChange={(e) => setLegalName(e.target.value)} placeholder="Razão social completa" />
              </Field>
              <Field label="CNPJ" span={1}>
                <TextInput mono value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0001-00" />
              </Field>
              {!editing && (
                <Field label="Subdomínio" required span={1} hint="Endereço da rede no sistema.">
                  <TextInput mono value={subdomain} onChange={(e) => setSubdomain(e.target.value)} placeholder="minharede" suffix=".app" />
                </Field>
              )}
              <Field label="Segmento" span={1} hint="Usado nos relatórios de adoção por ramo.">
                <SelectInput value={segment} onChange={setSegment}
                  options={['Varejo multicategoria', 'Vestuário', 'Calçados', 'Eletrônicos', 'Alimentos e bebidas', 'Material de construção', 'Farmácia', 'Autopeças', 'Papelaria', 'Casa e decoração', 'Outro']} />
              </Field>
              <Field label="Cidade" span={1}>
                <TextInput value={city} onChange={(e) => setCity(e.target.value)} placeholder="São Paulo" />
              </Field>
              <Field label="Estado" span={1}>
                <TextInput mono value={state} onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))} placeholder="SP" />
              </Field>
            </FormCard>

            <FormCard title="Contato do responsável" desc={editing ? 'Dono da conta — trocar exige convite novo, feito fora desta tela.' : 'Recebe o convite de acesso e passa pelo onboarding.'} cols={2}>
              <Field label="Nome" required={!editing} span={1}>
                <TextInput value={ownerName} onChange={(e) => setOwnerName(e.target.value)} disabled={editing} placeholder="Nome do proprietário" />
              </Field>
              <Field label="Telefone" span={1}>
                <TextInput mono value={owner?.phone ?? ''} disabled placeholder="—" />
              </Field>
              <Field label="Email" required={!editing} span={2} hint={editing ? null : 'O convite de primeiro acesso vai para este endereço.'}>
                <TextInput type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} disabled={editing} placeholder="responsavel@empresa.com.br" />
              </Field>
            </FormCard>

            <FormCard title="Plano e assinatura" cols={1}>
              <Field label="Plano" required>
                <div className={plans.length === 1 ? undefined : `g${Math.min(plans.length, 5)}`} style={{ gap: 8 }}>
                  {plans.map((p) => {
                    const on = planId === p.id;
                    return (
                      <button key={p.id} onClick={() => setPlanId(p.id)} style={{
                        display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'left',
                        padding: '11px 13px',
                        border: '1px solid ' + (on ? 'var(--accent)' : 'var(--line)'),
                        background: on ? 'var(--accent-soft)' : 'var(--bg-elev)',
                        borderRadius: 7,
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                          <PlanBadge plan={p.name} />
                          <span style={{ flex: 1 }}></span>
                          <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--fg)' }}>{brl(p.monthly_price)}</span>
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--fg-muted)', lineHeight: 1.4 }}>{p.tagline}</span>
                      </button>
                    );
                  })}
                </div>
              </Field>

              {editing && (
                <Field label="Status da assinatura" required>
                  <div style={{ display: 'flex', gap: 2, padding: 3, background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 7 }}>
                    {STATUS_OPTIONS.map((o) => (
                      <button key={o.k} onClick={() => setStatus(o.k)} style={{
                        flex: 1, background: status === o.k ? 'var(--bg-elev)' : 'transparent',
                        border: '1px solid ' + (status === o.k ? 'var(--line)' : 'transparent'),
                        borderRadius: 5, padding: '6px 10px', fontSize: 12.5, fontWeight: 500,
                        color: status === o.k ? 'var(--fg)' : 'var(--fg-muted)',
                      }}>{o.l}</button>
                    ))}
                  </div>
                </Field>
              )}
            </FormCard>

            {editing && (
              <div className="card" style={{ borderColor: 'var(--danger)', overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--danger)' }}>Ações sensíveis</h3>
                </div>
                <div style={{ padding: 18, fontSize: 12.5, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
                  Suspender acesso, forçar novo onboarding e excluir rede ainda não têm rotina de backend
                  (precisam de infraestrutura própria de suspensão/purga) — ficam para uma próxima leva.
                </div>
              </div>
            )}
          </div>

          <div data-sticky style={{ position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 10 }}>Resumo</div>
              <SummaryRow label="Plano" value={plan?.name ?? '—'} />
              {editing && <SummaryRow label="Status" value={STATUS_OPTIONS.find((o) => o.k === status)?.l ?? status} />}
              <div style={{ borderTop: '1px solid var(--line)', marginTop: 8, paddingTop: 8 }}>
                <SummaryRow label={status === 'trial' ? 'Após o trial' : 'Mensalidade'} value={brl(priceForPlan(plan))} strong tone={status === 'trial' ? undefined : 'success'} />
              </div>
              {status === 'trial' && tenant?.trial_ends_at && (
                <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 10, lineHeight: 1.5 }}>
                  Trial até {new Date(tenant.trial_ends_at).toLocaleDateString('pt-BR')}.
                </div>
              )}
            </div>

            {editing && detail && (
              <div className="card" style={{ padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 10 }}>Uso atual</div>
                <SummaryRow label="Lojas" value={`${detail.stores.length}`} />
                <SummaryRow label="Usuários" value={`${detail.users.length}`} />
                <SummaryRow label="SKUs" value={`${detail.skuCount}`} />
              </div>
            )}
          </div>
        </div>

        <FormPageFooter
          onCancel={() => navigate(editing ? `/admin/stores/detail?id=${tenant.id}` : '/admin/stores')}
          onSave={submit}
          saveLabel={pending ? 'Salvando…' : editing ? 'Salvar alterações' : 'Criar rede'}
        />
      </Page>
    </AdminShell>
  );
}

// === /admin/plans/new · /admin/plans/edit ===

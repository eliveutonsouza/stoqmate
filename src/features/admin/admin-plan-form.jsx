"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { CREDIT_UNIT_COST } from '@/lib/plans';
import { AdminShell } from '@/components/ui/admin-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Page } from '@/components/ui/page-container';
import { FormCard } from '@/components/ui/form-card';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { brl } from '@/lib/format';
import { SummaryRow } from '@/components/ui/summary-row';
import { FormPageFooter } from '@/components/ui/form-page-footer';
import { upsertPlanAction } from '@/features/admin/actions';

const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export function AdminPlanForm({ mode = 'new', plan }) {
  const navigate = useNavigate();
  const editing = mode === 'edit' && !!plan;

  const [id, setId] = React.useState(plan?.id ?? '');
  const [name, setName] = React.useState(plan?.name ?? '');
  const [tagline, setTagline] = React.useState(plan?.tagline ?? '');
  const [who, setWho] = React.useState(plan?.who ?? '');
  const [monthly, setMonthly] = React.useState(plan?.monthly_price ?? 0);
  const [yearly, setYearly] = React.useState(plan?.yearly_price ?? 0);
  const [credits, setCredits] = React.useState(plan?.credits ?? 0);
  const [limits, setLimits] = React.useState({
    skus: plan?.limits?.skus ?? '', users: plan?.limits?.users ?? '', stores: plan?.limits?.stores ?? '', cats: plan?.limits?.cats ?? '',
  });
  const [popular, setPopular] = React.useState(plan?.popular ?? false);
  const [active, setActive] = React.useState(plan?.active ?? true);
  const [error, setError] = React.useState('');
  const [pending, startTransition] = React.useTransition();

  const setLimit = (k, v) => setLimits((l) => ({ ...l, [k]: v }));
  const yearlyDiscount = monthly > 0 && yearly > 0 ? (1 - yearly / (monthly * 12)) * 100 : 0;
  const aiCost = credits * CREDIT_UNIT_COST;
  const canSave = name.trim() && monthly > 0 && (editing || id.trim());

  const submit = () => {
    setError('');
    if (!canSave) { setError('Preencha nome, identificador e preço mensal.'); return; }
    const planId = editing ? plan.id : slugify(id || name);
    startTransition(async () => {
      const result = await upsertPlanAction({
        id: planId, name, tagline, who, monthlyPrice: monthly, yearlyPrice: yearly || null,
        credits, limits: {
          skus: limits.skus === '' ? null : Number(limits.skus),
          users: limits.users === '' ? null : Number(limits.users),
          stores: limits.stores === '' ? null : Number(limits.stores),
          cats: limits.cats === '' ? null : Number(limits.cats),
        },
        popular, active,
      });
      if (result?.error) { setError(result.error); return; }
      navigate('/admin/plans');
    });
  };

  return (
    <AdminShell breadcrumb={['Planos', editing ? 'Editar plano' : 'Novo plano']} navigate={navigate}>
      <PageHeader
        title={editing ? `Editar ${plan.name}` : 'Novo plano'}
        sub="Este catálogo é o que /admin/subscriptions vai referenciar quando a assinatura (Stripe) estiver configurada."
      />
      <Page>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 16, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            {error && <div style={{ padding: '10px 12px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 7, fontSize: 12 }}>{error}</div>}

            <FormCard title="Identificação" cols={2}>
              <Field label="Nome do plano" required span={1}>
                <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Enterprise" />
              </Field>
              <Field label="Identificador" required={!editing} span={1} hint={editing ? 'Não muda depois de criado.' : 'Gerado do nome se deixar em branco.'}>
                <TextInput mono value={editing ? plan.id : id} onChange={(e) => setId(e.target.value)} placeholder="enterprise" disabled={editing} />
              </Field>
              <Field label="Descrição comercial" span={1} hint="Frase curta, aparece na página de planos.">
                <TextInput value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Para redes com mais de 20 lojas." />
              </Field>
              <Field label="Para quem é" span={1}>
                <TextInput value={who} onChange={(e) => setWho(e.target.value)} placeholder="Redes grandes, com SLA dedicado." />
              </Field>
            </FormCard>

            <FormCard title="Preço" cols={2}>
              <Field label="Mensal por loja" required span={1}>
                <TextInput mono prefix="R$" type="number" value={monthly} onChange={(e) => setMonthly(+e.target.value || 0)} />
              </Field>
              <Field label="Anual por loja" span={1} hint="Deixe zero para não oferecer plano anual.">
                <TextInput mono prefix="R$" type="number" value={yearly} onChange={(e) => setYearly(+e.target.value || 0)} />
              </Field>
            </FormCard>

            <FormCard title="Cota de IA" desc="A cota mensal é o que protege a margem: cada operação pesa o que custa de inferência." cols={1}>
              <Field label="Créditos por mês" required hint="Zero desativa a IA neste plano.">
                <TextInput mono type="number" value={credits} onChange={(e) => setCredits(+e.target.value || 0)} suffix="créditos" />
              </Field>
              <div style={{ padding: '11px 13px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 7, fontSize: 11.5, color: 'var(--fg-muted)', lineHeight: 1.55 }}>
                {credits.toLocaleString('pt-BR')} créditos custam <strong style={{ color: 'var(--fg)', fontWeight: 500 }}>{brl(aiCost)}</strong> de inferência no pior caso (P90).
              </div>
            </FormCard>

            <FormCard title="Limites" desc="Em branco = ilimitado." cols={2}>
              <Field label="Máx. SKUs" span={1} hint="Em branco = ilimitado"><TextInput mono value={limits.skus} onChange={(e) => setLimit('skus', e.target.value)} placeholder="∞" /></Field>
              <Field label="Máx. usuários" span={1} hint="Em branco = ilimitado"><TextInput mono value={limits.users} onChange={(e) => setLimit('users', e.target.value)} placeholder="∞" /></Field>
              <Field label="Máx. lojas" span={1} hint="Em branco = ilimitado"><TextInput mono value={limits.stores} onChange={(e) => setLimit('stores', e.target.value)} placeholder="∞" /></Field>
              <Field label="Máx. categorias" span={1} hint="Em branco = ilimitado"><TextInput mono value={limits.cats} onChange={(e) => setLimit('cats', e.target.value)} placeholder="∞" /></Field>
            </FormCard>

            <FormCard title="Disponibilidade" cols={2}>
              <Field label="Status" span={1}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, height: 36 }}>
                  <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Ativo (aparece no site)
                </label>
              </Field>
              <Field label="Destaque" span={1}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, height: 36 }}>
                  <input type="checkbox" checked={popular} onChange={(e) => setPopular(e.target.checked)} /> Marcar como mais escolhido
                </label>
              </Field>
            </FormCard>
          </div>

          <div style={{ position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 10 }}>Precificação</div>
              <SummaryRow label="Mensal" value={brl(monthly)} />
              <SummaryRow label="Anual" value={yearly ? brl(yearly) : '—'} />
              {yearlyDiscount > 0 && <SummaryRow label="Desconto no anual" value={yearlyDiscount.toFixed(0) + '%'} tone="success" />}
              <SummaryRow label="Créditos de IA" value={credits ? credits.toLocaleString('pt-BR') : '—'} />
              <div style={{ borderTop: '1px solid var(--line)', marginTop: 8, paddingTop: 8 }}>
                <SummaryRow label="Receita por loja/ano" value={brl(yearly || monthly * 12)} strong />
              </div>
            </div>

            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 10 }}>Limites configurados</div>
              <SummaryRow label="SKUs" value={limits.skus || '∞'} />
              <SummaryRow label="Usuários" value={limits.users || '∞'} />
              <SummaryRow label="Lojas" value={limits.stores || '∞'} />
              <SummaryRow label="Categorias" value={limits.cats || '∞'} />
            </div>
          </div>
        </div>

        <FormPageFooter
          onCancel={() => navigate('/admin/plans')}
          onSave={submit}
          saveLabel={pending ? 'Salvando…' : editing ? 'Salvar alterações' : 'Criar plano'}
        />
      </Page>
    </AdminShell>
  );
}

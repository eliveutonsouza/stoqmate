"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { CREDIT_UNIT_COST, INSTALLED_BASE, PLANS, PLATFORM, planEconomics } from '@/lib/plans';
import { AdminShell } from '@/components/ui/admin-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Page } from '@/components/ui/page-container';
import { FormCard } from '@/components/ui/form-card';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { TextareaInput } from '@/components/ui/textarea-input';
import { SelectInput } from '@/components/ui/select-input';
import { brl } from '@/lib/format';
import { SummaryRow } from '@/components/ui/summary-row';
import { I } from '@/components/icons';
import { FormPageFooter } from '@/components/ui/form-page-footer';

export function AdminPlanForm({ mode = 'new' }) {
  const navigate = useNavigate();
  const editing = mode === 'edit';
  // Todo o estado do editor vem de plans.js — o catálogo do console e a fonte
  // de preço do produto nunca podem divergir.
  const src = PLANS.find(p => p.id === 'controle') || PLANS[1];
  const [price, setPrice] = React.useState(editing ? src.monthly : 0);
  const [yearly, setYearly] = React.useState(editing ? src.yearly : 0);
  const [credits, setCredits] = React.useState(editing ? src.credits : 0);
  const [limits, setLimits] = React.useState(editing
    ? { skus: src.limits.skus ?? '', users: String(src.limits.users ?? ''), stores: String(src.limits.stores ?? ''), cats: src.limits.cats ?? '' }
    : { skus: '', users: '', stores: '', cats: '' });
  const set = (k, v) => setLimits(l => ({ ...l, [k]: v }));

  const yearlyDiscount = price > 0 && yearly > 0 ? (1 - yearly / (price * 12)) * 100 : 0;
  const aiCost = credits * CREDIT_UNIT_COST;
  const fixedCost = planEconomics(src).fixed;
  const margin = price > 0 ? ((price - aiCost - fixedCost) / price) * 100 : 0;

  return (
    <AdminShell route={editing ? '/admin/plans/edit' : '/admin/plans/new'} breadcrumb={['Planos', editing ? 'Editar plano' : 'Novo plano']} navigate={navigate}>
      <PageHeader
        title={editing ? 'Editar plano Controle' : 'Novo plano'}
        sub={editing
          ? `${INSTALLED_BASE[1].nets} redes · ${INSTALLED_BASE[1].units} lojas cobradas · ${PLATFORM.fmt(INSTALLED_BASE[1].units * src.monthly)} de MRR · mudanças valem no próximo ciclo de cada rede`
          : 'Limites em branco significam ilimitado.'}
      />
      <Page>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 16, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <FormCard title="Identificação" cols={2}>
              <Field label="Nome do plano" required span={1}>
                <TextInput defaultValue={editing ? src.name : ''} placeholder="Enterprise" />
              </Field>
              <Field label="Identificador" required span={1} hint="Usado na API e no Stripe.">
                <TextInput mono defaultValue={editing ? `plan_${src.id}` : ''} placeholder="plan_enterprise" />
              </Field>
              <Field label="Descrição comercial" span={2} hint="Aparece na página de planos.">
                <TextareaInput defaultValue={editing ? src.tagline : ''} placeholder="Para redes com mais de 20 lojas e necessidade de SLA." />
              </Field>
            </FormCard>

            <FormCard title="Preço" cols={2}>
              <Field label="Mensal por loja" required span={1}>
                <TextInput mono prefix="R$" type="number" value={price} onChange={(e) => setPrice(+e.target.value || 0)} />
              </Field>
              <Field label="Anual por loja" span={1} hint="Deixe zero para não oferecer plano anual.">
                <TextInput mono prefix="R$" type="number" value={yearly} onChange={(e) => setYearly(+e.target.value || 0)} />
              </Field>
              <Field label="Cobrança" span={1}>
                <SelectInput value="Por loja ativa" onChange={() => {}} options={['Por loja ativa', 'Por rede (flat)', 'Por usuário ativo']} />
              </Field>
              <Field label="Dias de trial" span={1}>
                <TextInput mono defaultValue="30" suffix="dias" />
              </Field>
            </FormCard>

            <FormCard title="Cota de IA" desc="A cota mensal é o que protege a margem: cada operação pesa o que custa de inferência." cols={2}>
              <Field label="Créditos por mês" required span={1} hint="Zero desativa a IA neste plano.">
                <TextInput mono type="number" value={credits} onChange={(e) => setCredits(+e.target.value || 0)} suffix="créditos" />
              </Field>
              <Field label="Ao esgotar a cota" span={1}>
                <SelectInput value="Pausar IA e oferecer pacote" onChange={() => {}} options={['Pausar IA e oferecer pacote', 'Cobrar excedente por crédito', 'Rebaixar para modelo mais barato']} />
              </Field>
              <div style={{ gridColumn: 'span 2', padding: '11px 13px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 7, fontSize: 11.5, color: 'var(--fg-muted)', lineHeight: 1.55 }}>
                {credits.toLocaleString('pt-BR')} créditos custam <strong style={{ color: 'var(--fg)', fontWeight: 500 }}>{brl(aiCost)}</strong> de inferência no pior caso (P90),
                mais {brl(fixedCost)} de infra, gateway e suporte. Margem bruta de <strong style={{ color: margin < 50 ? 'var(--danger)' : 'var(--fg)', fontWeight: 500 }}>{margin.toFixed(0)}%</strong> à loja que usa a cota inteira.
              </div>
            </FormCard>

            <FormCard title="Limites" desc="Em branco = ilimitado. O sistema avisa a rede ao chegar em 80%." cols={2}>
              <Field label="Máx. SKUs" span={1} hint="Em branco = ilimitado">
                <TextInput mono value={limits.skus} onChange={(e) => set('skus', e.target.value)} placeholder="∞" />
              </Field>
              <Field label="Máx. usuários" required span={1}>
                <TextInput mono value={limits.users} onChange={(e) => set('users', e.target.value)} placeholder="25" />
              </Field>
              <Field label="Máx. lojas" span={1} hint="Em branco = ilimitado">
                <TextInput mono value={limits.stores} onChange={(e) => set('stores', e.target.value)} placeholder="∞" />
              </Field>
              <Field label="Máx. categorias" span={1} hint="Em branco = ilimitado">
                <TextInput mono value={limits.cats} onChange={(e) => set('cats', e.target.value)} placeholder="∞" />
              </Field>
            </FormCard>

            <FormCard title="Recursos inclusos" cols={1}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  ['Relatórios essenciais', true],
                  ['Relatórios financeiros e lucro', true],
                  ['Transferência entre lojas', true],
                  ['Importação de planilhas', true],
                  ['Leitura de XML de NF-e', true],
                  ['Categorias personalizadas', true],
                  ['Previsão de demanda por IA', false],
                  ['Classificação automática por IA', false],
                  ['API de integração', false],
                  ['Exportações agendadas', false],
                  ['CSM dedicado', false],
                  ['SLA de 4 h', false],
                ].map(([f, on]) => (
                  <label key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, padding: '4px 0' }}>
                    <input type="checkbox" defaultChecked={editing ? on : false} /> {f}
                  </label>
                ))}
              </div>
            </FormCard>

            <FormCard title="Disponibilidade" cols={2}>
              <Field label="Status" span={1} hint="Planos descontinuados não aparecem no site.">
                <SelectInput value={editing ? 'Ativo' : 'Ativo'} onChange={() => {}} options={['Ativo', 'Oculto (só por link)', 'Descontinuado']} />
              </Field>
              <Field label="Destaque no site" span={1}>
                <SelectInput value={editing ? 'Marcar como mais escolhido' : 'Sem destaque'} onChange={() => {}} options={['Sem destaque', 'Marcar como mais escolhido', 'Marcar como melhor valor']} />
              </Field>
            </FormCard>
          </div>

          <div style={{ position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 10 }}>Precificação</div>
              <SummaryRow label="Mensal" value={brl(price)} />
              <SummaryRow label="Anual" value={yearly ? brl(yearly) : '—'} />
              {yearlyDiscount > 0 && <SummaryRow label="Desconto no anual" value={yearlyDiscount.toFixed(0) + '%'} tone="success" />}
              <SummaryRow label="Créditos de IA" value={credits ? credits.toLocaleString('pt-BR') : '—'} />
              <SummaryRow label="Custo de IA (P90)" value={brl(aiCost)} />
              <div style={{ borderTop: '1px solid var(--line)', marginTop: 8, paddingTop: 8 }}>
                <SummaryRow label="Receita por loja/ano" value={brl(yearly || price * 12)} strong />
              </div>
            </div>

            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 10 }}>Limites configurados</div>
              <SummaryRow label="SKUs" value={limits.skus || '∞'} />
              <SummaryRow label="Usuários" value={limits.users || '∞'} />
              <SummaryRow label="Lojas" value={limits.stores || '∞'} />
              <SummaryRow label="Categorias" value={limits.cats || '∞'} />
            </div>

            {editing && (
              <div style={{ padding: '12px 14px', background: 'var(--warning-soft)', border: '1px solid var(--warning)', borderRadius: 8, display: 'flex', gap: 10 }}>
                <span style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 1 }}><I.Alert size={14} /></span>
                <div style={{ fontSize: 11, color: 'var(--fg)', lineHeight: 1.5 }}>
                  <strong>68 redes</strong> usam este plano. Reduzir um limite pode deixá-las acima do permitido —
                  elas continuam funcionando, mas ficam bloqueadas para novos cadastros até se ajustarem.
                </div>
              </div>
            )}
          </div>
        </div>

        <FormPageFooter
          onCancel={() => navigate('/admin/plans')}
          onSave={() => navigate('/admin/plans')}
          saveLabel={editing ? 'Salvar alterações' : 'Criar plano'}
          extra={editing && <button className="btn btn-outline">Duplicar plano</button>}
        />
      </Page>
    </AdminShell>
  );
}

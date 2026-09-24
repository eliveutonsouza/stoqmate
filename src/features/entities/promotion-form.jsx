"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Page } from '@/components/ui/page-container';
import { FormCard } from '@/components/ui/form-card';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { I } from '@/components/icons';
import { ProductPicker } from '@/components/ui/product-picker';
import { SelectInput } from '@/components/ui/select-input';
import { SummaryRow } from '@/components/ui/summary-row';
import { brl } from '@/lib/format';
import { FormPageFooter } from '@/components/ui/form-page-footer';
import { createPromotionAction, setPromotionActiveAction } from '@/features/operations/promotions-actions';
import { EmptyState } from '@/components/ui/empty-state';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

/** @param {{ mode?: string, categories?: any[], promotion?: any }} props */
export function PromotionForm({ mode = 'new', categories, promotion }) {
  if (mode === 'edit') return <PromotionView promotion={promotion} />;
  return <PromotionCreateForm categories={categories} />;
}

function PromotionCreateForm({ categories }) {
  const navigate = useNavigate();
  const [name, setName] = React.useState('');
  const [scope, setScope] = React.useState('product');
  const [product, setProduct] = React.useState(null);
  const [categoryId, setCategoryId] = React.useState(categories[0]?.id ?? '');
  const [promoType, setPromoType] = React.useState('period');
  const [startsAt, setStartsAt] = React.useState(todayIso());
  const [endsAt, setEndsAt] = React.useState(todayIso());
  const [promoPrice, setPromoPrice] = React.useState(0);
  const [error, setError] = React.useState('');
  const [pending, startTransition] = React.useTransition();

  const original = scope === 'product' ? product?.sale_price ?? 0 : 0;
  const cost = scope === 'product' ? product?.cost_price ?? 0 : 0;
  const pctOff = original > 0 ? ((original - promoPrice) / original) * 100 : 0;
  const invalid = scope === 'product' && original > 0 && promoPrice >= original;
  const newMargin = promoPrice > 0 && cost > 0 ? ((promoPrice - cost) / promoPrice) * 100 : null;
  const canSubmit = name.trim() && promoPrice > 0 && !invalid
    && (scope !== 'product' || product) && (scope !== 'category' || categoryId);

  const submit = () => {
    setError('');
    if (!canSubmit) return;
    startTransition(async () => {
      const result = await createPromotionAction({
        name,
        scopeType: scope,
        productId: scope === 'product' ? product.id : null,
        categoryId: scope === 'category' ? categoryId : null,
        promoPrice,
        startsAt: new Date(`${startsAt}T00:00:00`).toISOString(),
        endsAt: promoType === 'period' ? new Date(`${endsAt}T23:59:59`).toISOString() : null,
        untilStock: promoType === 'until_stock',
      });
      if (result?.error) { setError(result.error); return; }
      navigate('/promotions');
    });
  };

  return (
    <StoreShell route="/promotions/new" breadcrumb={['Promoções', 'Criar']} navigate={navigate}>
      <PageHeader
        title="Criar promoção"
        sub="Altera o preço de venda aparente durante a vigência. O preço de compra e a margem histórica não são afetados."
      />
      <Page>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 16, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <FormCard title="Identificação" cols={1}>
              <Field label="Nome da promoção" required hint="Aparece no relatório de descontos e no histórico da venda.">
                <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Semana do Áudio" />
              </Field>
            </FormCard>

            <FormCard title="Abrangência" desc="A que o preço promocional se aplica." cols={1}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {[
                  { k: 'product', t: 'Um produto', d: 'Aplica ao SKU exato escolhido.' },
                  { k: 'category', t: 'Uma categoria inteira', d: 'Todos os produtos da categoria.' },
                  { k: 'store', t: 'Toda a loja', d: 'Aplica ao carrinho todo — configuração fina chega numa próxima etapa.' },
                ].map(o => (
                  <button key={o.k} onClick={() => setScope(o.k)} style={{
                    display: 'flex', gap: 11, alignItems: 'flex-start', textAlign: 'left',
                    padding: '10px 12px',
                    border: '1px solid ' + (scope === o.k ? 'var(--accent)' : 'var(--line)'),
                    background: scope === o.k ? 'var(--accent-soft)' : 'var(--bg-elev)',
                    borderRadius: 7, width: '100%',
                  }}>
                    <span style={{
                      width: 14, height: 14, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                      border: '1px solid ' + (scope === o.k ? 'var(--accent)' : 'var(--line-strong)'),
                      background: scope === o.k ? 'var(--accent-strong)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                    }}>{scope === o.k && <I.Check size={9} stroke={3} />}</span>
                    <span>
                      <span style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--fg)' }}>{o.t}</span>
                      <span style={{ display: 'block', fontSize: 12, color: 'var(--fg-muted)', marginTop: 1 }}>{o.d}</span>
                    </span>
                  </button>
                ))}
              </div>

              {scope === 'product' && (
                <Field label="Produto" required>
                  <ProductPicker product={product} onSelect={(p) => { setProduct(p); setPromoPrice(p.sale_price); }} onClear={() => setProduct(null)} />
                </Field>
              )}
              {scope === 'category' && (
                <Field label="Categoria" required>
                  <SelectInput value={categoryId} onChange={setCategoryId} options={categories.map((c) => ({ value: c.id, label: c.name }))} />
                </Field>
              )}
            </FormCard>

            <FormCard title="Vigência" cols={2}>
              <Field label="Tipo" required span={2}>
                <div style={{ display: 'flex', gap: 2, padding: 3, background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 7 }}>
                  {[{ k: 'period', l: 'Por período' }, { k: 'until_stock', l: 'Até acabar o estoque' }].map(o => (
                    <button key={o.k} onClick={() => setPromoType(o.k)} style={{
                      flex: 1, background: promoType === o.k ? 'var(--bg-elev)' : 'transparent',
                      border: '1px solid ' + (promoType === o.k ? 'var(--line)' : 'transparent'),
                      borderRadius: 5, padding: '6px 10px', fontSize: 12.5, fontWeight: 500,
                      color: promoType === o.k ? 'var(--fg)' : 'var(--fg-muted)',
                    }}>{o.l}</button>
                  ))}
                </div>
              </Field>
              <Field label="Início" required span={1}><TextInput type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} /></Field>
              {promoType === 'period' && (
                <Field label="Fim" required span={1}><TextInput type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} /></Field>
              )}
            </FormCard>

            <FormCard title="Preço" cols={2}>
              <Field label="Preço original" span={1} hint={scope === 'product' ? 'Preço de tabela do produto.' : 'Depende de cada produto na abrangência.'}>
                <TextInput mono prefix="R$" value={original || '—'} disabled />
              </Field>
              <Field label="Preço promocional" required span={1} error={invalid ? 'Deve ser menor que o preço original.' : null}>
                <TextInput mono prefix="R$" type="number" value={promoPrice} onChange={(e) => setPromoPrice(+e.target.value || 0)} />
              </Field>
              {scope === 'product' && original > 0 && (
                <Field label="Atalhos de desconto" span={2}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[5, 10, 15, 20, 30, 40].map(v => (
                      <button key={v} onClick={() => setPromoPrice(+(original * (1 - v / 100)).toFixed(2))} style={{
                        flex: 1, padding: '7px 0', background: 'var(--bg-elev)',
                        border: '1px solid var(--line)', borderRadius: 6,
                        fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--fg)',
                      }}>−{v}%</button>
                    ))}
                  </div>
                </Field>
              )}
            </FormCard>
          </div>

          <div style={{ position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {scope === 'product' && original > 0 && (
              <div className="card" style={{ padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 10 }}>Impacto</div>
                <SummaryRow label="Preço original" value={brl(original)} />
                <SummaryRow label="Preço promocional" value={brl(promoPrice)} />
                <SummaryRow label="Desconto" value={brl(Math.max(0, original - promoPrice))} tone="warning" />
                <div style={{ borderTop: '1px solid var(--line)', marginTop: 8, paddingTop: 8 }}>
                  <SummaryRow label="Desconto percentual" value={pctOff.toFixed(1) + '%'} strong tone={pctOff > 40 ? 'danger' : pctOff > 25 ? 'warning' : 'success'} />
                </div>
                {newMargin !== null && (
                  <div style={{ borderTop: '1px solid var(--line)', marginTop: 12, paddingTop: 12 }}>
                    <SummaryRow label="Custo por unidade" value={brl(cost)} />
                    <SummaryRow label="Margem na promoção" value={newMargin.toFixed(1) + '%'} tone={newMargin < 15 ? 'danger' : newMargin < 30 ? 'warning' : 'success'} />
                  </div>
                )}
                {newMargin !== null && newMargin < 15 && (
                  <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 7, display: 'flex', gap: 9 }}>
                    <span style={{ color: 'var(--danger)', flexShrink: 0, marginTop: 1 }}><I.Alert size={14} /></span>
                    <div style={{ fontSize: 11, lineHeight: 1.5 }}>Margem abaixo de 15% — confirme com o gestor financeiro antes de publicar.</div>
                  </div>
                )}
              </div>
            )}
            {error && (
              <div style={{ padding: '10px 12px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 7, fontSize: 12 }}>{error}</div>
            )}
          </div>
        </div>

        <FormPageFooter
          onCancel={() => navigate('/promotions')}
          onSave={submit}
          saveLabel={pending ? 'Criando…' : 'Criar promoção'}
        />
      </Page>
    </StoreShell>
  );
}

function PromotionView({ promotion }) {
  const navigate = useNavigate();
  const [pending, startTransition] = React.useTransition();

  if (!promotion) {
    return (
      <StoreShell route="/promotions/edit" breadcrumb={['Promoções', 'Detalhe']} navigate={navigate}>
        <PageHeader title="Promoção" />
        <Page>
          <EmptyState icon={<I.Alert size={18} />} title="Promoção não encontrada" desc="O link é inválido ou a promoção não existe mais."
            action={<button onClick={() => navigate('/promotions')} className="btn btn-primary btn-sm">Voltar</button>} />
        </Page>
      </StoreShell>
    );
  }

  const original = promotion.product?.sale_price ?? null;
  const off = original ? ((original - promotion.promo_price) / original) * 100 : null;
  const toggle = () => startTransition(async () => {
    await setPromotionActiveAction({ id: promotion.id, active: !promotion.active });
    navigate('/promotions');
  });

  return (
    <StoreShell route="/promotions/edit" breadcrumb={['Promoções', promotion.name]} navigate={navigate}>
      <PageHeader title={promotion.name} sub="Preço promocional aplicado durante a vigência." />
      <Page>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 16, alignItems: 'start' }}>
          <FormCard title="Detalhes" cols={2}>
            <Field label="Abrangência" span={1}>
              <TextInput disabled value={
                promotion.scope_type === 'product' ? `${promotion.product?.sku} · ${promotion.product?.name}`
                  : promotion.scope_type === 'category' ? promotion.category?.name
                  : 'Toda a loja'
              } />
            </Field>
            <Field label="Vigência" span={1}>
              <TextInput disabled value={
                `${new Date(promotion.starts_at).toLocaleDateString('pt-BR')}` +
                (promotion.ends_at ? ` – ${new Date(promotion.ends_at).toLocaleDateString('pt-BR')}` : promotion.until_stock ? ' – até acabar o estoque' : ' – sem fim definido')
              } />
            </Field>
            <Field label="Preço original" span={1}><TextInput mono prefix="R$" disabled value={original ?? '—'} /></Field>
            <Field label="Preço promocional" span={1}><TextInput mono prefix="R$" disabled value={promotion.promo_price} /></Field>
          </FormCard>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {off !== null && (
              <div className="card" style={{ padding: 16 }}>
                <SummaryRow label="Desconto" value={`${off.toFixed(1)}%`} strong />
              </div>
            )}
            <button onClick={toggle} disabled={pending} className="btn btn-primary btn-lg" style={{ justifyContent: 'center', width: '100%' }}>
              {pending ? 'Salvando…' : promotion.active ? 'Encerrar promoção agora' : 'Reativar promoção'}
            </button>
            <button onClick={() => navigate('/promotions')} className="btn btn-ghost" style={{ justifyContent: 'center', width: '100%' }}>Voltar</button>
          </div>
        </div>
      </Page>
    </StoreShell>
  );
}

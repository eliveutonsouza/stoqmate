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
import { MOCK } from '@/lib/mock';
import { SummaryRow } from '@/components/ui/summary-row';
import { brl } from '@/lib/format';
import { FormPageFooter } from '@/components/ui/form-page-footer';

export function PromotionForm({ mode = 'new' }) {
  const navigate = useNavigate();
  const editing = mode === 'edit';
  const [promoType, setPromoType] = React.useState('period');
  const [scope, setScope] = React.useState('product');
  const [prices, setPrices] = React.useState({ original: 299.00, promo: editing ? 249.00 : 299.00 });
  const pctOff = prices.original > 0 ? ((prices.original - prices.promo) / prices.original) * 100 : 0;
  const invalid = prices.promo >= prices.original;
  const cost = 158;
  const newMargin = prices.promo > 0 ? ((prices.promo - cost) / prices.promo) * 100 : 0;

  return (
    <StoreShell route={editing ? '/promotions/edit' : '/promotions/new'} breadcrumb={['Promoções', editing ? 'Editar' : 'Criar']} navigate={navigate}>
      <PageHeader
        title={editing ? 'Editar promoção' : 'Criar promoção'}
        sub="Altera o preço de venda aparente durante a vigência. O preço de compra e a margem histórica não são afetados."
      />
      <Page>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 16, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <FormCard title="Identificação" cols={1}>
              <Field label="Nome da promoção" required hint="Aparece no relatório de descontos e no histórico da venda.">
                <TextInput defaultValue={editing ? 'Semana do Áudio' : ''} placeholder="Semana do Áudio" />
              </Field>
            </FormCard>

            <FormCard title="Abrangência" desc="A que o preço promocional se aplica." cols={1}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {[
                  { k: 'sku', t: 'Um SKU específico', d: 'Só a variação exata escolhida.' },
                  { k: 'product', t: 'Um produto inteiro', d: 'Todas as variações do produto, em todas as combinações de atributos.' },
                  { k: 'attr', t: 'Um valor de atributo', d: 'Ex.: tudo que for tamanho PP, ou toda a cor Preto de uma categoria.' },
                  { k: 'category', t: 'Uma categoria inteira', d: 'Todos os produtos da categoria.' },
                  { k: 'store', t: 'Toda a loja', d: 'Com possibilidade de excluir categorias.' },
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
                  <ProductPicker product={{ sku: 'ELE-FONE-PR-128', cat: 'eletronicos', brand: 'Foneclear', name: 'Fone Bluetooth ANC', attrs: { cor: 'Preto', capacidade: '128 GB' }, stock: 42 }} />
                </Field>
              )}
              {scope === 'category' && (
                <Field label="Categoria" required>
                  <SelectInput value="Eletrônicos" onChange={() => {}} options={MOCK.categories.map(c => c.name)} />
                </Field>
              )}
              {scope === 'attr' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                  <Field label="Categoria" required><SelectInput value="Vestuário" onChange={() => {}} options={MOCK.categories.map(c => c.name)} /></Field>
                  <Field label="Atributo" required><SelectInput value="Tamanho" onChange={() => {}} options={['Cor', 'Tamanho']} /></Field>
                  <Field label="Valor" required><SelectInput value="PP" onChange={() => {}} options={['PP', 'P', 'M', 'G', 'GG', 'XG']} /></Field>
                </div>
              )}
              {scope === 'sku' && (
                <Field label="SKU" required><ProductPicker /></Field>
              )}
              {scope === 'store' && (
                <Field label="Categorias excluídas" hint="Deixe vazio para aplicar a tudo.">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                    {MOCK.categories.map((c, i) => (
                      <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                        <input type="checkbox" defaultChecked={i === 4} /> {c.name}
                      </label>
                    ))}
                  </div>
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
              {promoType === 'period' ? (
                <>
                  <Field label="Início" required span={1}><TextInput type="date" defaultValue="2026-09-20" /></Field>
                  <Field label="Fim" required span={1}><TextInput type="date" defaultValue="2026-09-30" /></Field>
                </>
              ) : (
                <Field label="Encerrar quando o saldo chegar a" span={1} hint="A promoção sai do ar sozinha.">
                  <TextInput mono defaultValue="0" suffix="un" />
                </Field>
              )}
              <Field label="Unidades participantes" span={promoType === 'period' ? 2 : 1} hint="A promoção pode valer só em algumas lojas.">
                <SelectInput value="Todas as unidades" onChange={() => {}} options={['Todas as unidades', ...MOCK.store.siblings.map(s => s.name)]} />
              </Field>
            </FormCard>

            <FormCard title="Preço" cols={2}>
              <Field label="Preço original" span={1} hint="Preço de tabela do produto.">
                <TextInput mono prefix="R$" value={prices.original} readOnly style={{ background: 'var(--bg-sunken)' }} />
              </Field>
              <Field label="Preço promocional" required span={1} error={invalid ? 'Deve ser menor que o preço original.' : null}>
                <TextInput mono prefix="R$" type="number" value={prices.promo} onChange={(e) => setPrices(p => ({ ...p, promo: +e.target.value || 0 }))} />
              </Field>
              <Field label="Atalhos de desconto" span={2}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[5, 10, 15, 20, 30, 40].map(v => (
                    <button key={v} onClick={() => setPrices(p => ({ ...p, promo: +(p.original * (1 - v / 100)).toFixed(2) }))} style={{
                      flex: 1, padding: '7px 0', background: 'var(--bg-elev)',
                      border: '1px solid var(--line)', borderRadius: 6,
                      fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--fg)',
                    }}>−{v}%</button>
                  ))}
                </div>
              </Field>
            </FormCard>
          </div>

          <div style={{ position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 10 }}>Impacto</div>
              <SummaryRow label="Preço original" value={brl(prices.original)} />
              <SummaryRow label="Preço promocional" value={brl(prices.promo)} />
              <SummaryRow label="Desconto" value={brl(prices.original - prices.promo)} tone="warning" />
              <div style={{ borderTop: '1px solid var(--line)', marginTop: 8, paddingTop: 8 }}>
                <SummaryRow label="Desconto percentual" value={pctOff.toFixed(1) + '%'} strong tone={pctOff > 40 ? 'danger' : pctOff > 25 ? 'warning' : 'success'} />
              </div>
              <div style={{ borderTop: '1px solid var(--line)', marginTop: 12, paddingTop: 12 }}>
                <SummaryRow label="Custo por unidade" value={brl(cost)} />
                <SummaryRow label="Margem antes" value="47,2%" />
                <SummaryRow label="Margem na promoção" value={newMargin.toFixed(1) + '%'} tone={newMargin < 15 ? 'danger' : newMargin < 30 ? 'warning' : 'success'} />
              </div>
              {newMargin < 15 && !invalid && (
                <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 7, display: 'flex', gap: 9 }}>
                  <span style={{ color: 'var(--danger)', flexShrink: 0, marginTop: 1 }}><I.Alert size={14} /></span>
                  <div style={{ fontSize: 11, lineHeight: 1.5 }}>Margem abaixo de 15%. Promoções assim precisam de aprovação do gestor financeiro.</div>
                </div>
              )}
            </div>

            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 10 }}>Alcance estimado</div>
              <SummaryRow label="SKUs afetados" value="8" />
              <SummaryRow label="Itens em estoque" value="243" />
              <SummaryRow label="Unidades participantes" value="4" />
            </div>
          </div>
        </div>

        <FormPageFooter
          onCancel={() => navigate('/promotions')}
          onSave={() => navigate('/promotions')}
          saveLabel={editing ? 'Salvar alterações' : 'Criar promoção'}
          extra={<button className="btn btn-outline">Salvar como rascunho</button>}
        />
      </Page>
    </StoreShell>
  );
}

// === /shelves/new · /shelves/edit ===

"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { Toolbar } from '@/components/ui/toolbar';
import { PROMOS } from '@/features/operations/promos';
import { CategoryBadge } from '@/components/ui/category-badge';
import { brl } from '@/lib/format';
import { Modal } from '@/components/ui/modal';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { SelectInput } from '@/components/ui/select-input';
import { SummaryRow } from '@/components/ui/summary-row';

export function Promotions() {
  const navigate = useNavigate();
  const [formOpen, setFormOpen] = React.useState(false);
  const [promoType, setPromoType] = React.useState('period');
  const [prices, setPrices] = React.useState({ original: 299.00, promo: 249.00 });
  const pctOff = prices.original > 0 ? ((prices.original - prices.promo) / prices.original) * 100 : 0;
  const invalid = prices.promo >= prices.original;
  const statusMap = { active: { label: 'Ativa', cls: 'badge-success' }, scheduled: { label: 'Agendada', cls: 'badge-info' }, ended: { label: 'Encerrada', cls: 'badge' } };

  return (
    <StoreShell route="/promotions" breadcrumb={['Promoções']} navigate={navigate}>
      <PageHeader
        title="Promoções"
        sub="3 ativas · 1 agendada · R$ 24.760 em descontos concedidos em setembro"
        actions={<button onClick={() => navigate('/promotions/new')} className="btn btn-primary btn-sm"><I.Plus size={13} /> Criar promoção</button>}
        tabs={[{ id: 'all', label: 'Todas · 6' }, { id: 'active', label: 'Ativas · 3' }, { id: 'scheduled', label: 'Agendadas · 1' }, { id: 'ended', label: 'Encerradas · 2' }]}
        activeTab="all"
      />
      <Page>
        <Toolbar placeholder="Buscar promoção…" filters={[{ label: 'Categoria', value: 'Todas' }, { label: 'Tipo', value: 'Todos' }]} right={<span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>6 promoções</span>} />

        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Promoção</th><th>Abrangência</th><th>Categoria</th><th>Tipo</th><th>Vigência</th>
                <th className="num">De</th><th className="num">Por</th><th className="num">Desconto</th><th className="num">Vendidos</th><th>Status</th><th style={{ width: 30 }}></th>
              </tr>
            </thead>
            <tbody>
              {PROMOS.map((p, i) => {
                const off = p.original > 0 ? ((p.original - p.promo) / p.original) * 100 : null;
                const st = statusMap[p.status];
                return (
                  <tr key={i}>
                    <td><a href="#" onClick={(e) => { e.preventDefault(); navigate('/promotions/edit'); }} style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</a></td>
                    <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{p.scope}</td>
                    <td>{p.cat ? <CategoryBadge cat={p.cat} /> : <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>Todas</span>}</td>
                    <td><span className="badge">{p.type === 'period' ? 'Por período' : 'Até acabar'}</span></td>
                    <td style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>
                      {p.start}{p.end ? ` – ${p.end}` : ' – estoque'}
                    </td>
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)', textDecoration: p.original ? 'line-through' : 'none' }}>
                      {p.original ? brl(p.original) : '—'}
                    </td>
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500 }}>{p.promo ? brl(p.promo) : '—'}</td>
                    <td className="num">
                      {off !== null ? <span className="badge badge-accent">−{off.toFixed(0)}%</span> : <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>variável</span>}
                    </td>
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{p.sold}</td>
                    <td><span className={`badge ${st.cls}`}>{p.status === 'active' && <span className="badge-dot"></span>} {st.label}</span></td>
                    <td><button className="btn btn-ghost btn-icon btn-sm"><I.More size={13} /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Page>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Criar promoção" desc="Altera o preço de venda aparente. O preço de compra não é afetado." width={520}
        footer={<>
          <button onClick={() => setFormOpen(false)} className="btn btn-ghost">Cancelar</button>
          <button onClick={() => setFormOpen(false)} className="btn btn-primary" disabled={invalid} style={{ opacity: invalid ? 0.45 : 1 }}>Criar promoção</button>
        </>}>
        <Field label="Nome da promoção" required><TextInput placeholder="Semana do Áudio" /></Field>
        <Field label="Abrangência" required hint="Aplique a um SKU, a um produto inteiro ou a uma categoria.">
          <SelectInput value="Eletrônicos · Foneclear · todos os SKUs" onChange={() => {}}
            options={['Eletrônicos · Foneclear · todos os SKUs', 'Eletrônicos · toda a categoria', 'Vestuário · tamanho PP', 'SKU específico', 'Toda a loja']} />
        </Field>

        <Field label="Tipo de promoção" required>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {[
              { k: 'period', t: 'Por período', d: 'Vale entre as datas definidas.' },
              { k: 'until_stock', t: 'Até acabar o estoque', d: 'Encerra sozinha quando o saldo zera.' },
            ].map(o => (
              <button key={o.k} onClick={() => setPromoType(o.k)} style={{
                display: 'flex', gap: 11, alignItems: 'flex-start', textAlign: 'left',
                padding: '10px 12px',
                border: '1px solid ' + (promoType === o.k ? 'var(--accent)' : 'var(--line)'),
                background: promoType === o.k ? 'var(--accent-soft)' : 'var(--bg-elev)',
                borderRadius: 7, width: '100%',
              }}>
                <span style={{
                  width: 14, height: 14, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                  border: '1px solid ' + (promoType === o.k ? 'var(--accent)' : 'var(--line-strong)'),
                  background: promoType === o.k ? 'var(--accent-strong)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                }}>{promoType === o.k && <I.Check size={9} stroke={3} />}</span>
                <span>
                  <span style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--fg)' }}>{o.t}</span>
                  <span style={{ display: 'block', fontSize: 12, color: 'var(--fg-muted)', marginTop: 1 }}>{o.d}</span>
                </span>
              </button>
            ))}
          </div>
        </Field>

        {promoType === 'period' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Início" required><TextInput type="date" defaultValue="2026-09-20" /></Field>
            <Field label="Fim" required><TextInput type="date" defaultValue="2026-09-30" /></Field>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Preço original" hint="Preço de tabela do produto.">
            <TextInput mono prefix="R$" value={prices.original} readOnly style={{ background: 'var(--bg-sunken)' }} />
          </Field>
          <Field label="Preço promocional" required error={invalid ? 'Deve ser menor que o preço original.' : null}>
            <TextInput mono prefix="R$" type="number" value={prices.promo} onChange={(e) => setPrices(p => ({ ...p, promo: +e.target.value || 0 }))} />
          </Field>
        </div>

        <div style={{ background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 8, padding: '12px 14px' }}>
          <SummaryRow label="Desconto concedido" value={brl(prices.original - prices.promo)} />
          <div style={{ borderTop: '1px solid var(--line)', marginTop: 8, paddingTop: 8 }}>
            <SummaryRow label="Desconto percentual" value={pctOff.toFixed(1) + '%'} strong tone={pctOff > 40 ? 'danger' : pctOff > 25 ? 'warning' : 'success'} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 8, lineHeight: 1.5 }}>
            Margem cai de 47,2% para {(((prices.promo - 158) / prices.promo) * 100).toFixed(1)}% considerando o custo de {brl(158)} por unidade.
          </div>
        </div>
      </Modal>
    </StoreShell>
  );
}

// === Stock locations ===

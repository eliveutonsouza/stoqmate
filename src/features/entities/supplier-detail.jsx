"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { brl } from '@/lib/format';
import { AttrChip } from '@/components/ui/attr-chip';
import { variantLabel } from '@/lib/attr-colors';
import { EmptyState } from '@/components/ui/empty-state';

export function SupplierDetail({ supplier: s }) {
  const navigate = useNavigate();

  if (!s) {
    return (
      <StoreShell route="/suppliers/detail" breadcrumb={['Fornecedores']} navigate={navigate}>
        <PageHeader title="Fornecedor" />
        <Page>
          <EmptyState
            icon={<I.Truck size={18} />}
            title="Fornecedor não encontrado"
            desc="O link é inválido ou o fornecedor foi removido."
            action={<button onClick={() => navigate('/suppliers')} className="btn btn-primary btn-sm">Voltar aos fornecedores</button>}
          />
        </Page>
      </StoreShell>
    );
  }

  return (
    <StoreShell route="/suppliers/detail" breadcrumb={['Fornecedores', s.name]} navigate={navigate}>
      <PageHeader
        title={s.name}
        sub={`${s.cats.map((c) => c.name).join(', ') || 'Sem categoria'}${s.cnpj ? ` · CNPJ ${s.cnpj}` : ''}`}
        actions={(
          <>
            <button onClick={() => navigate(`/suppliers/edit?id=${s.id}`)} className="btn btn-outline btn-sm">Editar</button>
            <button onClick={() => navigate('/stock/entry')} className="btn btn-primary btn-sm"><I.Plus size={13} /> Nova entrada</button>
          </>
        )}
      />
      <Page>
        <div className="g3 kpi-strip">
          {[
            { l: 'Comprado (últimas compras)', v: brl(s.purchasedRecently) },
            { l: 'SKUs vinculados', v: `${s.productCount}` },
            { l: 'Prazo médio de entrega', v: s.avgLeadDays !== null ? `${s.avgLeadDays} dias` : '—', s: s.avgLeadDays !== null ? 'baseado em pedidos recebidos' : 'sem pedidos recebidos ainda' },
          ].map((m, i) => (
            <div key={i} style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{m.l}</div>
              <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>{m.v}</div>
              {m.s && <div style={{ fontSize: 10, color: 'var(--fg-muted)', marginTop: 2 }}>{m.s}</div>}
            </div>
          ))}
        </div>

        <div className="split-2" style={{ '--a': '1fr', '--b': '1.4fr' }}>
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Cadastro</h3>
            </div>
            {[
              ['CNPJ', s.cnpj || '—', true],
              ['Telefone', s.phone || '—', true],
              ['Email', s.order_email || '—'],
              ['Representante', s.sales_rep || '—'],
              ['Categorias', s.cats.map((c) => c.name).join(', ') || '—'],
              ['Marcas', (s.brands || []).join(', ') || '—'],
              ['Pedido mínimo', s.min_order_value ? brl(s.min_order_value) : '—', true],
              ['Pagamento', s.payment_terms || '—'],
              ...(s.notes ? [['Observações', s.notes]] : []),
            ].map(([k, v, mono], i, arr) => (
              <div key={k} style={{ display: 'flex', gap: 12, padding: '10px 18px', borderBottom: i < arr.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
                <span style={{ fontSize: 12, color: 'var(--fg-muted)', width: 104, flexShrink: 0 }}>{k}</span>
                <span style={{ fontSize: 12, fontWeight: 500, fontFamily: mono ? 'var(--font-mono)' : undefined }}>{v}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Últimas compras</h3>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>{s.purchases.length} pedido{s.purchases.length === 1 ? '' : 's'} mais recente{s.purchases.length === 1 ? '' : 's'}.</p>
                </div>
                <button onClick={() => navigate('/purchase-orders')} className="btn btn-ghost btn-sm">Ver todas <I.ChevronRight size={12} /></button>
              </div>
              {s.purchases.length === 0 ? (
                <EmptyState icon={<I.Truck size={18} />} title="Nenhuma compra ainda" desc="Pedidos deste fornecedor aparecem aqui." />
              ) : (
                <div className="table-scroll"><table className="table">
                  <thead>
                    <tr><th>Data</th><th className="num">Itens</th><th className="num">Valor</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {s.purchases.map((p) => (
                      <tr key={p.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>
                          {new Date(p.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{p.items}</td>
                        <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{brl(p.value)}</td>
                        <td>
                          {p.status === 'received'
                            ? <span className="badge badge-success"><I.Check size={10} stroke={3} /> Recebida</span>
                            : <span className="badge badge-info">Pedido aberto</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
              )}
            </div>

            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>SKUs deste fornecedor</h3>
              </div>
              {s.products.length === 0 ? (
                <EmptyState icon={<I.Box size={18} />} title="Nenhum SKU vinculado" desc="Vincule este fornecedor ao cadastrar ou editar um produto." />
              ) : (
                <div className="table-scroll"><table className="table">
                  <thead>
                    <tr><th>SKU</th><th>Produto</th><th>Variação</th><th className="num">Saldo</th><th className="num">Custo</th></tr>
                  </thead>
                  <tbody>
                    {s.products.map((p) => (
                      <tr key={p.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)' }}>{p.sku}</td>
                        <td style={{ fontSize: 13 }}>{p.name}</td>
                        <td><AttrChip value={variantLabel(p.attrs || {})} /></td>
                        <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{p.stock}</td>
                        <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{brl(p.cost_price ?? 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
              )}
              {s.productCount > s.products.length && (
                <div style={{ padding: '10px 18px', background: 'var(--bg-sunken)', borderTop: '1px solid var(--line)', fontSize: 11, color: 'var(--fg-muted)' }}>
                  Mostrando {s.products.length} de {s.productCount} SKUs
                </div>
              )}
            </div>
          </div>
        </div>
      </Page>
    </StoreShell>
  );
}

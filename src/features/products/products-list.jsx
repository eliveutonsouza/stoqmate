"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { Toolbar } from '@/components/ui/toolbar';
import { CategoryBadge } from '@/components/ui/category-badge';
import { ProductThumb } from '@/components/ui/product-thumb';
import { AttrChip } from '@/components/ui/attr-chip';
import { variantLabel } from '@/lib/attr-colors';
import { EmptyState } from '@/components/ui/empty-state';
import { brl } from '@/lib/format';

export function ProductsList({ initialProducts, categories }) {
  const navigate = useNavigate();
  const [cat, setCat] = React.useState('all');
  const [selected, setSelected] = React.useState(new Set());

  const products = React.useMemo(
    () => initialProducts.map((p) => ({
      ...p,
      stock: (p.stock_balances || []).reduce((s, b) => s + b.qty, 0),
    })),
    [initialProducts],
  );

  const rows = cat === 'all' ? products : products.filter((p) => p.category?.id === cat);
  const allSelected = selected.size > 0 && selected.size === rows.length;
  const activeCat = cat === 'all' ? null : categories.find((c) => c.id === cat);

  return (
    <StoreShell route="/products" breadcrumb={['Catálogo', 'Produtos']} navigate={navigate}>
      <PageHeader
        title="Catálogo"
        sub={`${products.length} SKU${products.length === 1 ? '' : 's'} · ${categories.length} categoria${categories.length === 1 ? '' : 's'}`}
        actions={(
          <>
            <button onClick={() => navigate('/categories')} className="btn btn-outline btn-sm"><I.Sliders size={13} /> Categorias</button>
            <button onClick={() => navigate('/products/import')} className="btn btn-outline btn-sm"><I.Download size={13} /> Importar planilha</button>
            <button onClick={() => navigate('/products/new')} className="btn btn-primary btn-sm"><I.Plus size={13} /> Cadastrar produto</button>
          </>
        )}
        tabs={[
          { id: 'all', label: `Todas · ${products.length}` },
          ...categories.map((c) => ({ id: c.id, label: `${c.name} · ${products.filter((p) => p.category?.id === c.id).length}` })),
        ]}
        activeTab={cat}
        onTab={(id) => { setCat(id); setSelected(new Set()); }}
      />

      <Page>
        {products.length === 0 ? (
          <EmptyState
            icon={<I.Box size={18} />}
            title="Nenhum produto cadastrado ainda"
            desc={categories.length === 0
              ? 'Crie uma categoria primeiro — ela define os atributos do produto e a unidade de medida do estoque.'
              : 'Cadastre o primeiro SKU pra começar a controlar o estoque.'}
            action={categories.length === 0
              ? <button onClick={() => navigate('/categories')} className="btn btn-primary btn-sm">Criar categoria</button>
              : <button onClick={() => navigate('/products/new')} className="btn btn-primary btn-sm"><I.Plus size={12} /> Cadastrar produto</button>}
          />
        ) : (
          <>
            <Toolbar
              placeholder="Buscar por SKU, código de barras, marca ou nome…"
              filters={[
                { label: 'Marca', value: 'Todas' },
                ...(activeCat ? [] : [{ label: 'Variação', value: 'Todas' }]),
                { label: 'Local', value: 'Todos' },
                { label: 'Estoque', value: '≥ 1' },
              ]}
              right={<span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{selected.size > 0 ? `${selected.size} selecionado(s)` : `${rows.length} itens`}</span>}
            />

            {activeCat && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 11,
                padding: '10px 14px', background: 'var(--bg-sunken)',
                border: '1px solid var(--line)', borderRadius: 8, fontSize: 12,
              }}>
                <CategoryBadge category={activeCat} />
                <span style={{ color: 'var(--fg-muted)' }}>unidade de medida: <strong style={{ color: 'var(--fg)', fontWeight: 500 }}>{activeCat.unit}</strong></span>
                <div style={{ flex: 1 }}></div>
                <button onClick={() => navigate('/categories')} className="btn btn-ghost btn-sm">Editar esquema</button>
              </div>
            )}

            <div className="card" style={{ overflow: 'hidden' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>
                      <input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(rows.map((_, i) => i)))} />
                    </th>
                    <th>Produto</th>
                    <th>SKU</th>
                    {!activeCat && <th>Categoria</th>}
                    <th>Variação</th>
                    <th>Local</th>
                    <th>Fornecedor</th>
                    <th className="num">Estoque</th>
                    <th className="num">Preço</th>
                    <th style={{ width: 30 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p, i) => (
                    <tr key={p.id} style={{ background: selected.has(i) ? 'var(--accent-soft)' : undefined }}>
                      <td>
                        <input type="checkbox" checked={selected.has(i)} onChange={() => {
                          const n = new Set(selected); if (n.has(i)) n.delete(i); else n.add(i); setSelected(n);
                        }} />
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <ProductThumb category={p.category} brand={p.brand} attrs={p.attrs} size={28} />
                          <div>
                            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/products/detail'); }} style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</a>
                            <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{p.brand}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)' }}>{p.sku}</td>
                      {!activeCat && <td>{p.category && <CategoryBadge category={p.category} />}</td>}
                      <td><AttrChip value={variantLabel(p.attrs || {})} /></td>
                      <td style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>{p.location?.code ?? '—'}</td>
                      <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{p.supplier?.name ?? '—'}</td>
                      <td className="num">
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500,
                          color: p.stock < p.min_stock ? 'var(--danger)' : p.stock < p.min_stock * 2 ? 'var(--warning)' : 'var(--fg)',
                        }}>{p.stock}</span>
                        <span style={{ fontSize: 10, color: 'var(--fg-muted)', marginLeft: 4 }}>{p.category?.unit}</span>
                      </td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{brl(p.sale_price)}</td>
                      <td><button className="btn btn-ghost btn-icon btn-sm"><I.More size={13} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ padding: '10px 14px', borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-sunken)' }}>
                <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>Mostrando {rows.length} de {rows.length}</span>
                <div style={{ flex: 1 }}></div>
                <button className="btn btn-ghost btn-sm" disabled><I.ChevronLeft size={12} /> Anterior</button>
                <button className="btn btn-ghost btn-sm" disabled>Próxima <I.ChevronRight size={12} /></button>
              </div>
            </div>
          </>
        )}
      </Page>
    </StoreShell>
  );
}
